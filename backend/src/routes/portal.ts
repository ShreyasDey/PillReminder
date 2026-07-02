import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { emitToPatient, emitToPharmacy } from "../lib/realtime.js";
import { notify } from "../lib/notify.js";
import { adherencePct, dailyAdherenceSeries, ymd } from "../lib/schedule.js";

const CODE_RE = /^[A-Z0-9]{4}-[A-Z0-9]{5}$/;

// ── Inventory demand forecasting ──
// Demand is *learned from real counter-sale history* instead of being configured by
// hand: the average daily units sold over a trailing window, expressed as a 7-day
// figure. Items with no sales history fall back to their stored demand (0 for new
// items) so we never invent a forecast we can't back up.
const DEMAND_WINDOW_DAYS = 28;
const COVER_DAYS = 14; // reorder suggestion targets ~2 weeks of cover

async function computeDemand7d(pharmacyId: string): Promise<Map<string, number>> {
  const since = new Date(Date.now() - DEMAND_WINDOW_DAYS * 86_400_000);
  const dispenses = await prisma.dispense.findMany({
    where: { pharmacyId, at: { gte: since } },
    select: { items: true },
  });
  const totals = new Map<string, number>();
  for (const d of dispenses) {
    const items = Array.isArray(d.items) ? (d.items as Array<{ name?: string; qty?: number }>) : [];
    for (const it of items) {
      if (!it?.name) continue;
      totals.set(it.name, (totals.get(it.name) ?? 0) + (Number(it.qty) || 0));
    }
  }
  const demand = new Map<string, number>();
  for (const [name, qty] of totals) demand.set(name, Math.round((qty / DEMAND_WINDOW_DAYS) * 7));
  return demand;
}

// Units to order so stock covers the next COVER_DAYS at the current demand rate.
function suggestedOrderQty(stock: number, demand7d: number): number {
  if (demand7d <= 0) return 0;
  const target = Math.ceil((demand7d * COVER_DAYS) / 7);
  return Math.max(0, target - stock);
}

export default async function portalRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.requirePharmacist);

  // Resolve the pharmacist's pharmacy on every request.
  app.addHook("preHandler", async (req, reply) => {
    if (!req.user.pharmacyId) return reply.code(403).send({ error: "No pharmacy assigned" });
  });

  // ── Pharmacy profile + code ──
  app.get("/pharmacy", async (req) =>
    prisma.pharmacy.findUnique({ where: { id: req.user.pharmacyId! } }),
  );

  app.patch("/pharmacy", async (req, reply) => {
    const body = z
      .object({ name: z.string().optional(), location: z.string().optional(), hours: z.string().optional(), lat: z.number().optional(), lng: z.number().optional(), code: z.string().optional() })
      .parse(req.body);
    if (body.code) {
      if (!CODE_RE.test(body.code)) return reply.code(400).send({ error: "Invalid code format" });
      const clash = await prisma.pharmacy.findUnique({ where: { code: body.code } });
      if (clash && clash.id !== req.user.pharmacyId)
        return reply.code(409).send({ error: "Code already in use" });
    }
    return prisma.pharmacy.update({ where: { id: req.user.pharmacyId! }, data: body });
  });

  // ── Patients (linked to this pharmacy via code) ──
  app.get("/patients", async (req) => {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { id: req.user.pharmacyId! } });
    if (!pharmacy) return [];
    // A patient belongs to this pharmacy if it's their primary OR one of their
    // linked pharmacies (a patient can link several). Matching only the primary
    // would hide patients who linked this pharmacy as a secondary.
    const profiles = await prisma.patientProfile.findMany({
      where: {
        OR: [
          { linkedPharmacyCode: pharmacy.code },
          { linkedPharmacyCodes: { has: pharmacy.code } },
        ],
      },
      include: { user: true },
    });

    // Attach a computed adherence % + medication summary per patient.
    const out = [];
    for (const p of profiles) {
      const doses = await prisma.doseLog.findMany({
        where: { medication: { patientId: p.userId }, date: { gte: ymd(new Date(Date.now() - 30 * 86_400_000)) } },
      });
      const meds = await prisma.medication.findMany({
        where: { patientId: p.userId, active: true },
        select: { drug: true, dose: true, groupId: true },
      });
      const drugNames = [...new Set(meds.map((m) => `${m.drug}${m.dose ? " " + m.dose : ""}`))];
      const lastOrder = await prisma.refillOrder.findFirst({
        where: { patientId: p.userId },
        orderBy: { placedAt: "desc" },
      });
      const spent = await prisma.refillOrder.aggregate({
        where: { patientId: p.userId, status: "delivered" },
        _sum: { amount: true },
      });
      out.push({
        id: p.userId,
        name: p.user.name,
        phone: p.user.phone,
        age: p.age,
        gender: p.gender,
        conditions: p.conditions,
        adherence: adherencePct(doses),
        medCount: drugNames.length,
        meds: drugNames,
        lastRefill: lastOrder?.placedAt ?? null,
        spent: spent._sum.amount ?? 0,
        since: p.user.createdAt,
        isNew: drugNames.length === 0,
      });
    }
    return out;
  });

  // Dashboard — one rich payload, ALL computed from real data for this pharmacy.
  app.get("/dashboard", async (req) => {
    const pharmacyId = req.user.pharmacyId!;
    const pharmacy = await prisma.pharmacy.findUnique({ where: { id: pharmacyId } });
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const since30 = ymd(new Date(now.getTime() - 30 * 86_400_000));

    // Patients linked to this pharmacy + their adherence.
    const profiles = pharmacy
      ? await prisma.patientProfile.findMany({
          where: {
            OR: [
              { linkedPharmacyCode: pharmacy.code },
              { linkedPharmacyCodes: { has: pharmacy.code } },
            ],
          },
          include: { user: true },
        })
      : [];
    const adhByPatient: { id: string; name: string; adherence: number | null; createdAt: Date }[] = [];
    for (const p of profiles) {
      const doses = await prisma.doseLog.findMany({
        where: { medication: { patientId: p.userId }, date: { gte: since30 } },
        select: { status: true, skipExcluded: true },
      });
      adhByPatient.push({ id: p.userId, name: p.user.name, adherence: adherencePct(doses), createdAt: p.user.createdAt });
    }
    const measured = adhByPatient.filter((a) => a.adherence != null);
    const adherenceAvg = measured.length
      ? Math.round(measured.reduce((s, a) => s + (a.adherence ?? 0), 0) / measured.length)
      : null;
    const atRisk = adhByPatient.filter((a) => a.adherence != null && a.adherence < 70);
    const newThisWeek = adhByPatient.filter((a) => a.createdAt >= weekAgo);

    // Refills.
    const refills = await prisma.refillOrder.findMany({
      where: { pharmacyId },
      orderBy: { placedAt: "desc" },
      include: { patient: true },
      take: 50,
    });
    const pendingRefills = refills.filter((r) => r.status === "pending");
    const readyRefills = refills.filter((r) => r.status === "ready");

    // Inventory — demand forecast learned from real sales history.
    const inventoryRaw = await prisma.inventoryItem.findMany({ where: { pharmacyId } });
    const demandMap = await computeDemand7d(pharmacyId);
    const inventory = inventoryRaw.map((i) => ({ ...i, demand7d: demandMap.has(i.name) ? demandMap.get(i.name)! : i.demand7d }));
    const lowStock = inventory.filter((i) => i.stock <= i.demand7d);
    const inventoryValue = inventory.reduce((s, i) => s + i.stock * i.mrp, 0);

    // Dispenses (revenue).
    const dispToday = await prisma.dispense.aggregate({ where: { pharmacyId, at: { gte: todayStart } }, _sum: { total: true }, _count: true });
    const dispMonth = await prisma.dispense.aggregate({ where: { pharmacyId, at: { gte: monthStart } }, _sum: { total: true }, _count: true });
    const recentDisp = await prisma.dispense.findMany({ where: { pharmacyId }, orderBy: { at: "desc" }, take: 6, include: { patient: true } });

    // 7-day revenue series.
    const allDisp = await prisma.dispense.findMany({ where: { pharmacyId, at: { gte: weekAgo } }, select: { at: true, total: true } });
    const days7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getTime() - (6 - i) * 86_400_000);
      const key = ymd(d);
      const amount = allDisp.filter((x) => ymd(x.at) === key).reduce((s, x) => s + x.total, 0);
      return { day: d.toLocaleDateString("en-IN", { weekday: "short" }), date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), amount };
    });

    // 12-month revenue series.
    const yearAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const yearDisp = await prisma.dispense.findMany({ where: { pharmacyId, at: { gte: yearAgo } }, select: { at: true, total: true } });
    const months12 = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const amount = yearDisp.filter((x) => x.at.getFullYear() === d.getFullYear() && x.at.getMonth() === d.getMonth()).reduce((s, x) => s + x.total, 0);
      return { m: d.toLocaleDateString("en-IN", { month: "short" }), amount };
    });

    const rel = (date: Date) => {
      const ms = now.getTime() - date.getTime();
      const h = Math.floor(ms / 3_600_000);
      if (h < 1) return `${Math.max(1, Math.floor(ms / 60_000))} min ago`;
      if (h < 24) return `${h}h ago`;
      return "yesterday";
    };

    // Activity feed from real events.
    const activity = [
      ...refills.slice(0, 5).map((r) => ({ id: `r-${r.id}`, time: rel(r.placedAt), kind: "order", icon: "◷", text: `Refill ${r.displayId} ${r.status} — ${r.patient.name}` })),
      ...recentDisp.map((d) => ({ id: `d-${d.id}`, time: rel(d.at), kind: "delivered", icon: "⇨", text: `Counter sale — ${d.patient?.name ?? "walk-in"}, ₹${Math.round(d.total / 100)}` })),
      ...newThisWeek.slice(0, 3).map((p) => ({ id: `n-${p.id}`, time: rel(p.createdAt), kind: "new", icon: "+", text: `New patient linked: ${p.name}` })),
    ].slice(0, 10);

    // Urgent attention.
    const urgent = [
      ...atRisk.slice(0, 3).map((a) => ({ id: `risk-${a.id}`, patientId: a.id, kind: "adherence-dip", title: `Adherence at ${a.adherence}% — ${a.name}`, detail: "Below 70% over last 30 days", tag: a.adherence! < 50 ? "SWITCH RISK" : "ADHERENCE", tagColor: a.adherence! < 50 ? "red" : "amber", action: "Send SMS" })),
      ...pendingRefills.slice(0, 2).map((r) => ({ id: `ord-${r.id}`, patientId: r.patientId, kind: "pending-order", title: `Refill ₹${Math.round(r.amount / 100)} awaiting confirmation`, detail: `${r.patient.name} · ${rel(r.placedAt)}`, tag: "PENDING", tagColor: "amber", action: "Confirm order" })),
      ...lowStock.slice(0, 2).map((i) => {
        const sug = suggestedOrderQty(i.stock, i.demand7d);
        return { id: `stock-${i.id}`, patientId: null, kind: "out-of-stock", title: `${i.name} running low`, detail: `${i.stock} left · 7-day demand ${i.demand7d}${sug > 0 ? ` · suggest ordering ~${sug}` : ""}`, tag: i.stock <= 0 ? "CRITICAL" : "AMBER", tagColor: i.stock <= 0 ? "red" : "amber", action: "Reorder" };
      }),
    ];

    return {
      pharmacyName: pharmacy?.name ?? "",
      patientCount: profiles.length,
      pendingRefills: pendingRefills.length,
      criticalRefills: pendingRefills.filter((r) => r.status === "pending" && r.amount >= 300000).length,
      readyRefills: readyRefills.length,
      ordersToday: refills.filter((r) => r.placedAt >= todayStart).length,
      lowStock: lowStock.length,
      inventoryValue,
      revenueToday: dispToday._sum.total ?? 0,
      salesToday: dispToday._count,
      revenueMonth: dispMonth._sum.total ?? 0,
      avgOrderValue: dispMonth._count ? Math.round((dispMonth._sum.total ?? 0) / dispMonth._count) : 0,
      adherenceAvg,
      atRiskCount: atRisk.length,
      newThisWeek: newThisWeek.length,
      newPatientName: newThisWeek[0]?.name ?? null,
      activity,
      urgent,
      revenue7d: days7,
      revenue12m: months12,
    };
  });

  app.get("/patients/:id", async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const profile = await prisma.patientProfile.findUnique({ where: { userId: id }, include: { user: true } });
    if (!profile) return reply.code(404).send({ error: "Patient not found" });
    const meds = await prisma.medication.findMany({ where: { patientId: id, active: true } });
    const doses = await prisma.doseLog.findMany({
      where: { medication: { patientId: id }, date: { gte: ymd(new Date(Date.now() - 90 * 86_400_000)) } },
      select: { date: true, status: true, skipExcluded: true },
    });
    const refills = await prisma.refillOrder.findMany({
      where: { patientId: id },
      orderBy: { placedAt: "desc" },
      take: 12,
    });
    return {
      profile,
      medications: meds,
      adherence: adherencePct(doses),
      series: dailyAdherenceSeries(doses), // real per-day adherence for the timeline chart
      refills,
    };
  });

  // ── Prescribe-to-app (the heart of the bridge) ──
  app.post("/pushes", async (req, reply) => {
    const body = z
      .object({
        patientId: z.string(),
        note: z.string().optional(),
        meds: z.array(z.any()),
      })
      .parse(req.body);
    const pharmacy = await prisma.pharmacy.findUnique({ where: { id: req.user.pharmacyId! } });
    if (!pharmacy) return reply.code(404).send({ error: "Pharmacy not found" });

    const push = await prisma.pharmacyPush.create({
      data: {
        pharmacyId: pharmacy.id,
        patientId: body.patientId,
        pharmacyName: pharmacy.name,
        pharmacyCode: pharmacy.code,
        meds: body.meds,
        note: body.note,
      },
    });
    // Realtime banner in the patient app + a stored notification.
    emitToPatient(body.patientId, "push.created", push);
    await notify({
      userId: body.patientId,
      kind: "pharmacy-push",
      title: `${pharmacy.name} sent ${body.meds.length} medicine(s)`,
      body: body.note ?? undefined,
    });
    return reply.code(201).send(push);
  });

  app.get("/pushes", async (req) =>
    prisma.pharmacyPush.findMany({ where: { pharmacyId: req.user.pharmacyId! }, orderBy: { pushedAt: "desc" } }),
  );

  // ── Inventory ──
  // Demand (7d) is computed live from sales history; suggestedOrder tells the
  // pharmacy how many units to reorder to reach ~2 weeks of cover.
  app.get("/inventory", async (req) => {
    const pharmacyId = req.user.pharmacyId!;
    const [items, demand] = await Promise.all([
      prisma.inventoryItem.findMany({ where: { pharmacyId }, orderBy: { name: "asc" } }),
      computeDemand7d(pharmacyId),
    ]);
    return items.map((i) => {
      const d7 = demand.has(i.name) ? demand.get(i.name)! : i.demand7d;
      return { ...i, demand7d: d7, suggestedOrder: suggestedOrderQty(i.stock, d7) };
    });
  });

  // Add a new medicine (or top up an existing one by name). Persisted in the DB.
  app.post("/inventory", async (req, reply) => {
    const body = z
      .object({
        name: z.string().min(1),
        stock: z.number().int().default(0),
        demand7d: z.number().int().default(0),
        mrp: z.number().int(), // paise
        supplier: z.string().optional(),
      })
      .parse(req.body);
    const item = await prisma.inventoryItem.upsert({
      where: { pharmacyId_name: { pharmacyId: req.user.pharmacyId!, name: body.name } },
      update: { stock: { increment: body.stock }, mrp: body.mrp, supplier: body.supplier },
      create: { pharmacyId: req.user.pharmacyId!, name: body.name, stock: body.stock, demand7d: body.demand7d, mrp: body.mrp, supplier: body.supplier },
    });
    emitToPharmacy(req.user.pharmacyId!, "inventory.changed", item);
    return reply.code(201).send(item);
  });

  app.patch("/inventory/:id", async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({ stock: z.number().int().optional(), demand7d: z.number().int().optional(), mrp: z.number().int().optional() }).parse(req.body);
    const item = await prisma.inventoryItem.findFirst({ where: { id, pharmacyId: req.user.pharmacyId! } });
    if (!item) return reply.code(404).send({ error: "Not found" });
    const updated = await prisma.inventoryItem.update({ where: { id }, data: body });
    emitToPharmacy(req.user.pharmacyId!, "inventory.changed", updated);
    return updated;
  });

  // ── Counter sale (walk-in dispense) ──
  app.post("/dispenses", async (req, reply) => {
    const body = z
      .object({
        patientId: z.string().optional(),
        items: z.array(z.object({ name: z.string(), qty: z.number().int().positive(), mrp: z.number().int() })),
        total: z.number().int(),
        offer: z.object({ label: z.string(), discount: z.number() }).nullable().optional(),
      })
      .parse(req.body);

    const pharmacyId = req.user.pharmacyId!;

    // Decrement stock (respecting available), then record the dispense.
    const result = await prisma.$transaction(async (tx) => {
      for (const it of body.items) {
        const inv = await tx.inventoryItem.findFirst({ where: { pharmacyId, name: it.name } });
        if (inv) {
          const newStock = Math.max(0, inv.stock - it.qty);
          await tx.inventoryItem.update({ where: { id: inv.id }, data: { stock: newStock } });
        }
      }
      return tx.dispense.create({
        data: {
          pharmacyId,
          patientId: body.patientId ?? null,
          items: body.items,
          total: body.total,
          offer: body.offer ?? undefined,
        },
      });
    });

    // Re-learn demand for the items just sold so the forecast stays current.
    const demand = await computeDemand7d(pharmacyId);
    await Promise.all(
      body.items.map((it) =>
        demand.has(it.name)
          ? prisma.inventoryItem.updateMany({ where: { pharmacyId, name: it.name }, data: { demand7d: demand.get(it.name)! } })
          : Promise.resolve(),
      ),
    );

    emitToPharmacy(pharmacyId, "inventory.changed", { reason: "dispense" });
    if (body.patientId) {
      emitToPatient(body.patientId, "dispense.created", result);
      const pharmacy = await prisma.pharmacy.findUnique({ where: { id: pharmacyId } });
      await notify({
        userId: body.patientId,
        kind: "pickup",
        title: `Pickup recorded at ${pharmacy?.name}`,
        body: `${body.items.length} item(s) · ₹${(body.total / 100).toFixed(0)}`,
      });
    }
    return reply.code(201).send(result);
  });

  // ── Refill queue ──
  app.get("/refills", async (req) =>
    prisma.refillOrder.findMany({
      where: { pharmacyId: req.user.pharmacyId! },
      orderBy: { placedAt: "desc" },
      include: { patient: true },
    }),
  );

  app.patch("/refills/:id/status", async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = z
      .object({
        status: z.enum(["pending", "confirmed", "ready", "delivered", "declined"]),
        declineReason: z.string().optional(),
      })
      .parse(req.body);
    const order = await prisma.refillOrder.findFirst({ where: { id, pharmacyId: req.user.pharmacyId! } });
    if (!order) return reply.code(404).send({ error: "Not found" });

    const updated = await prisma.refillOrder.update({
      where: { id },
      data: { status: body.status, declineReason: body.declineReason },
    });

    // Marking collected = goods leave the shelf: decrement stock, record a dispense
    // (so it feeds revenue + demand), and tell both sides inventory changed.
    if (body.status === "delivered") {
      const pharmacyId = req.user.pharmacyId!;
      const orderItems = Array.isArray(order.items)
        ? (order.items as Array<{ med?: string; qty?: number }>)
        : [];
      const inv = await prisma.inventoryItem.findMany({ where: { pharmacyId } });
      const byName = new Map(inv.map((i) => [i.name, i]));
      const dispenseItems: { name: string; qty: number; mrp: number }[] = [];
      await prisma.$transaction(async (tx) => {
        for (const it of orderItems) {
          if (!it?.med || !it?.qty) continue;
          const stockItem = byName.get(it.med);
          if (stockItem) {
            await tx.inventoryItem.update({
              where: { id: stockItem.id },
              data: { stock: Math.max(0, stockItem.stock - it.qty) },
            });
          }
          dispenseItems.push({ name: it.med, qty: it.qty, mrp: stockItem?.mrp ?? 0 });
        }
        if (dispenseItems.length) {
          await tx.dispense.create({
            data: { pharmacyId, patientId: order.patientId, items: dispenseItems, total: order.amount },
          });
        }
      });
      // Re-learn demand for the collected items.
      const demand = await computeDemand7d(pharmacyId);
      await Promise.all(
        dispenseItems.map((it) =>
          demand.has(it.name)
            ? prisma.inventoryItem.updateMany({ where: { pharmacyId, name: it.name }, data: { demand7d: demand.get(it.name)! } })
            : Promise.resolve(),
        ),
      );
      emitToPharmacy(pharmacyId, "inventory.changed", { reason: "refill-collected" });
    }

    emitToPatient(order.patientId, "refill.updated", updated);
    await notify({
      userId: order.patientId,
      kind: "refill",
      title: `Refill ${order.displayId} ${body.status}`,
      body: body.declineReason,
    });
    return updated;
  });

  // ── Offers ──
  app.get("/offers", async (req) =>
    prisma.offer.findMany({ where: { pharmacyId: req.user.pharmacyId! }, orderBy: { createdAt: "desc" } }),
  );
  app.post("/offers", async (req, reply) => {
    const body = z
      .object({ label: z.string(), discount: z.number().int(), reach: z.number().int().default(0), expiry: z.string().optional() })
      .parse(req.body);
    // Only one promotion can be live at a time — retire any currently-active one.
    await prisma.offer.updateMany({ where: { pharmacyId: req.user.pharmacyId!, active: true }, data: { active: false } });
    const row = await prisma.offer.create({
      data: { ...body, active: true, expiry: body.expiry ? new Date(body.expiry) : null, pharmacyId: req.user.pharmacyId! },
    });
    return reply.code(201).send(row);
  });
  app.patch("/offers/:id", async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({ active: z.boolean().optional(), label: z.string().optional(), discount: z.number().int().optional() }).parse(req.body);
    return prisma.offer.update({ where: { id }, data: body });
  });

  // ── Analytics ──
  app.get("/analytics/revenue", async (req) => {
    const dispenses = await prisma.dispense.findMany({
      where: { pharmacyId: req.user.pharmacyId! },
      orderBy: { at: "desc" },
      take: 200,
    });
    const total = dispenses.reduce((s, d) => s + d.total, 0);
    return { total, count: dispenses.length, dispenses };
  });
}
