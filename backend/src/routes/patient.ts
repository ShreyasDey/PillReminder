import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { emitToPharmacy } from "../lib/realtime.js";
import { notify } from "../lib/notify.js";
import { vapidPublicKey, sendPushToUser } from "../lib/webpush.js";
import { addMedicationForPatient, type MedPayload } from "../services/medications.js";
import { adherencePct, dailyAdherenceSeries, ymd } from "../lib/schedule.js";
import {
  PERMISSIONS,
  type Permission,
  hasPermission,
  normalizePermissions,
  sanitizePermissions,
} from "../lib/permissions.js";

// Phones are stored in varied formats ("+91 9876543210", "9876543210", …).
// Match/compare on the last 10 digits so invites reliably reach the right account.
const last10 = (phone: string) => phone.replace(/\D/g, "").slice(-10);

async function findUserByLast10(last: string) {
  if (!last) return null;
  const users = await prisma.user.findMany({
    where: { phone: { contains: last } },
    select: { id: true, name: true, phone: true },
  });
  return users.find((u) => last10(u.phone) === last) || null;
}

// Resolve :linkId, verify the caller is the active caregiver on that link and holds
// the required permission. On failure it sends the error response and returns null.
async function authorizeCaregiver(
  req: FastifyRequest,
  reply: FastifyReply,
  required: Permission,
) {
  const { linkId } = z.object({ linkId: z.string() }).parse(req.params);
  const link = await prisma.familyLink.findFirst({
    where: { id: linkId, memberId: req.user.sub, status: "active" },
  });
  if (!link) {
    reply.code(404).send({ error: "Not a caregiver for this patient" });
    return null;
  }
  if (!hasPermission(link.permissions, required)) {
    reply.code(403).send({ error: "You don't have permission for this action" });
    return null;
  }
  return link;
}

// Great-circle distance in km between two lat/lng points.
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default async function patientRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.requirePatient);

  // ── Profile ──
  app.get("/me", async (req) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      include: { profile: true },
    });
    return user;
  });

  app.patch("/me", async (req) => {
    const body = z
      .object({
        name: z.string().optional(),
        age: z.number().int().optional(),
        gender: z.string().optional(),
        conditions: z.array(z.string()).optional(),
        language: z.string().optional(),
        linkedPharmacyCode: z.string().optional(),
      })
      .parse(req.body);

    if (body.name) await prisma.user.update({ where: { id: req.user.sub }, data: { name: body.name } });

    // Validate pharmacy code link against a real pharmacy.
    let linkedPharmacyCode = body.linkedPharmacyCode;
    if (linkedPharmacyCode) {
      const pharmacy = await prisma.pharmacy.findUnique({ where: { code: linkedPharmacyCode } });
      if (!pharmacy) linkedPharmacyCode = undefined; // ignore invalid codes silently
    }

    // Keep the multi-pharmacy set in sync: linking by code adds to the list and
    // becomes the primary if none is set yet.
    let codesUpdate = {};
    if (linkedPharmacyCode) {
      const existing = await prisma.patientProfile.findUnique({ where: { userId: req.user.sub } });
      const set = new Set(existing?.linkedPharmacyCodes ?? []);
      set.add(linkedPharmacyCode);
      codesUpdate = { linkedPharmacyCodes: Array.from(set) };
    }

    return prisma.patientProfile.update({
      where: { userId: req.user.sub },
      data: {
        age: body.age,
        gender: body.gender,
        conditions: body.conditions,
        language: body.language,
        ...(linkedPharmacyCode ? { linkedPharmacyCode } : {}),
        ...codesUpdate,
      },
    });
  });

  // ── Linked pharmacies (a patient can link several) ──
  app.get("/me/pharmacies", async (req) => {
    const profile = await prisma.patientProfile.findUnique({ where: { userId: req.user.sub } });
    const codes = profile?.linkedPharmacyCodes ?? [];
    if (!codes.length) return [];
    const pharmacies = await prisma.pharmacy.findMany({ where: { code: { in: codes } } });
    const out = [];
    for (const p of pharmacies) {
      const offer = await prisma.offer.findFirst({
        where: { pharmacyId: p.id, active: true },
        orderBy: { createdAt: "desc" },
      });
      out.push({
        name: p.name,
        code: p.code,
        location: p.location,
        hours: p.hours,
        lat: p.lat,
        lng: p.lng,
        primary: p.code === profile?.linkedPharmacyCode,
        offer: offer ? { label: offer.label, discount: offer.discount, expiry: offer.expiry } : null,
      });
    }
    return out;
  });

  app.post("/me/pharmacies", async (req, reply) => {
    const { code } = z.object({ code: z.string() }).parse(req.body);
    const pharmacy = await prisma.pharmacy.findUnique({ where: { code } });
    if (!pharmacy) return reply.code(404).send({ error: "No pharmacy with that code" });
    const profile = await prisma.patientProfile.findUnique({ where: { userId: req.user.sub } });
    const set = new Set(profile?.linkedPharmacyCodes ?? []);
    set.add(code);
    const updated = await prisma.patientProfile.update({
      where: { userId: req.user.sub },
      data: { linkedPharmacyCodes: Array.from(set), linkedPharmacyCode: profile?.linkedPharmacyCode || code },
    });
    return reply.code(201).send(updated);
  });

  app.delete("/me/pharmacies/:code", async (req) => {
    const { code } = z.object({ code: z.string() }).parse(req.params);
    const profile = await prisma.patientProfile.findUnique({ where: { userId: req.user.sub } });
    const arr = (profile?.linkedPharmacyCodes ?? []).filter((c) => c !== code);
    const primary = profile?.linkedPharmacyCode === code ? arr[0] ?? null : profile?.linkedPharmacyCode ?? null;
    await prisma.patientProfile.update({
      where: { userId: req.user.sub },
      data: { linkedPharmacyCodes: arr, linkedPharmacyCode: primary },
    });
    return { ok: true };
  });

  // Catalog (prices + live stock) for one linked pharmacy — powers price display
  // and the "can't order more than is in stock" check in the refill builder.
  app.get("/pharmacies/catalog", async (req, reply) => {
    const { code } = z.object({ code: z.string() }).parse(req.query);
    const pharmacy = await prisma.pharmacy.findUnique({ where: { code } });
    if (!pharmacy) return reply.code(404).send({ error: "No pharmacy with that code" });
    const [items, offer] = await Promise.all([
      prisma.inventoryItem.findMany({ where: { pharmacyId: pharmacy.id }, orderBy: { name: "asc" } }),
      prisma.offer.findFirst({ where: { pharmacyId: pharmacy.id, active: true }, orderBy: { createdAt: "desc" } }),
    ]);
    return {
      pharmacy: { name: pharmacy.name, code: pharmacy.code, location: pharmacy.location, hours: pharmacy.hours },
      offer: offer ? { label: offer.label, discount: offer.discount, expiry: offer.expiry } : null,
      items: items.map((i) => ({ name: i.name, stock: i.stock, mrp: i.mrp })),
    };
  });

  // ── Web Push (medication reminders) ──
  app.get("/push/vapid", async () => ({ publicKey: vapidPublicKey }));

  app.post("/push/subscribe", async (req, reply) => {
    const body = z
      .object({
        endpoint: z.string().url(),
        keys: z.object({ p256dh: z.string(), auth: z.string() }),
      })
      .parse(req.body);
    await prisma.pushSubscription.upsert({
      where: { endpoint: body.endpoint },
      update: { userId: req.user.sub, p256dh: body.keys.p256dh, auth: body.keys.auth },
      create: { userId: req.user.sub, endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth },
    });
    return reply.code(201).send({ ok: true });
  });

  app.post("/push/unsubscribe", async (req) => {
    const body = z.object({ endpoint: z.string() }).parse(req.body);
    await prisma.pushSubscription.deleteMany({ where: { endpoint: body.endpoint, userId: req.user.sub } });
    return { ok: true };
  });

  app.post("/push/test", async (req) => {
    await sendPushToUser(req.user.sub, {
      title: "SaathiPill reminders are on ✅",
      body: "This is how your medicine reminders will look.",
      tag: "test",
    });
    return { ok: true };
  });

  // ── Dashboard: today's doses + adherence ──
  app.get("/me/dashboard", async (req) => {
    const date = ymd(new Date());
    const meds = await prisma.medication.findMany({
      where: { patientId: req.user.sub, active: true },
      include: { doseLogs: { where: { date } } },
    });

    const last30 = await prisma.doseLog.findMany({
      where: {
        medication: { patientId: req.user.sub },
        date: { gte: ymd(new Date(Date.now() - 30 * 86_400_000)) },
      },
    });

    return {
      date,
      medications: meds,
      adherence: adherencePct(last30),
    };
  });

  app.get("/me/adherence", async (req) => {
    const { days } = z.object({ days: z.coerce.number().default(30) }).parse(req.query);
    const since = ymd(new Date(Date.now() - days * 86_400_000));
    const doses = await prisma.doseLog.findMany({
      where: { medication: { patientId: req.user.sub }, date: { gte: since } },
    });
    return { days, adherence: adherencePct(doses), total: doses.length };
  });

  // Per-day adherence series — feeds the home rolling chart + analytics calendar.
  // Computed from real dose logs; empty for a brand-new user.
  app.get("/me/adherence/daily", async (req) => {
    const { days } = z.object({ days: z.coerce.number().default(90) }).parse(req.query);
    const since = ymd(new Date(Date.now() - days * 86_400_000));
    const doses = await prisma.doseLog.findMany({
      where: { medication: { patientId: req.user.sub }, date: { gte: since } },
      select: { date: true, status: true, skipExcluded: true },
    });
    return { days, series: dailyAdherenceSeries(doses) };
  });

  // Pharmacies registered in SaathiPill, ranked by distance from the patient's
  // GPS location. Powers the "browse nearby pharmacies" picker.
  app.get("/pharmacies/nearby", async (req) => {
    const { lat, lng } = z
      .object({ lat: z.coerce.number().optional(), lng: z.coerce.number().optional() })
      .parse(req.query);
    const pharmacies = await prisma.pharmacy.findMany({
      select: { name: true, location: true, hours: true, code: true, lat: true, lng: true },
    });
    const out = pharmacies.map((p) => ({
      name: p.name,
      location: p.location,
      hours: p.hours,
      code: p.code,
      distanceKm:
        lat != null && lng != null && p.lat != null && p.lng != null
          ? Math.round(distanceKm(lat, lng, p.lat, p.lng) * 10) / 10
          : null,
    }));
    out.sort((a, b) => {
      if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
      if (a.distanceKm != null) return -1;
      if (b.distanceKm != null) return 1;
      return a.name.localeCompare(b.name);
    });
    return out.slice(0, 25);
  });

  // Look up a single pharmacy by its code (for linking by code, even far away).
  app.get("/pharmacies/by-code", async (req, reply) => {
    const { code } = z.object({ code: z.string() }).parse(req.query);
    const p = await prisma.pharmacy.findUnique({
      where: { code },
      select: { name: true, location: true, hours: true, code: true },
    });
    if (!p) return reply.code(404).send({ error: "No pharmacy with that code" });
    return p;
  });

  // ── Medications ──
  app.get("/medications", async (req) => {
    return prisma.medication.findMany({
      where: { patientId: req.user.sub, active: true },
      orderBy: { createdAt: "desc" },
    });
  });

  app.post("/medications", async (req, reply) => {
    const med = req.body as MedPayload;
    const created = await addMedicationForPatient(req.user.sub, med);
    return reply.code(201).send(created);
  });

  app.delete("/medications/:groupId", async (req) => {
    const { groupId } = z.object({ groupId: z.string() }).parse(req.params);
    await prisma.medication.updateMany({
      where: { groupId, patientId: req.user.sub },
      data: { active: false },
    });
    return { ok: true };
  });

  // ── Doses ──
  app.get("/doses", async (req) => {
    const { date } = z.object({ date: z.string().default(ymd(new Date())) }).parse(req.query);
    return prisma.doseLog.findMany({
      where: { medication: { patientId: req.user.sub }, date },
      include: { medication: true },
    });
  });

  // Mark take / skip / snooze. Server is source of truth for adherence.
  app.patch("/doses/:id", async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = z
      .object({
        action: z.enum(["take", "skip", "snooze"]),
        skipReason: z.string().optional(),
        skipExcluded: z.boolean().optional(),
        offline: z.boolean().optional(),
      })
      .parse(req.body);

    const dose = await prisma.doseLog.findFirst({
      where: { id, medication: { patientId: req.user.sub } },
      include: { medication: true },
    });
    if (!dose) return reply.code(404).send({ error: "Dose not found" });

    if (body.action === "take") {
      const updated = await prisma.doseLog.update({
        where: { id },
        data: { status: "taken", takenAt: new Date(), pendingSync: !!body.offline },
      });
      return updated;
    }

    if (body.action === "skip") {
      return prisma.doseLog.update({
        where: { id },
        data: {
          status: "skipped",
          skipReason: body.skipReason,
          skipExcluded: !!body.skipExcluded,
        },
      });
    }

    // snooze: re-remind in 10 minutes; cap at 3, then escalate to caregiver
    const next = dose.snoozeCount + 1;
    const updated = await prisma.doseLog.update({
      where: { id },
      data: { snoozeCount: next, nextRemindAt: new Date(Date.now() + 10 * 60_000) },
    });
    if (next >= 3) {
      // Escalate to this patient's caregivers: links where the patient is the OWNER
      // and a caregiver (member) has accepted. Notify each caregiver.
      const caregivers = await prisma.familyLink.findMany({
        where: { ownerId: req.user.sub, status: "active", memberId: { not: null } },
      });
      const patient = await prisma.user.findUnique({ where: { id: req.user.sub } });
      for (const c of caregivers) {
        if (!c.memberId) continue;
        await notify({
          userId: c.memberId,
          kind: "escalation",
          title: `${patient?.name} missed a dose`,
          body: `${dose.medication.drug} at ${dose.scheduledTime} — snoozed ${next} times.`,
        });
      }
      return { ...updated, escalated: true };
    }
    return updated;
  });

  // Offline queue flush: bulk reconcile doses marked while offline.
  app.post("/doses/sync", async (req) => {
    const body = z
      .object({
        doses: z.array(
          z.object({ id: z.string(), action: z.enum(["take", "skip"]), takenAt: z.string().optional() }),
        ),
      })
      .parse(req.body);

    let synced = 0;
    for (const d of body.doses) {
      const owned = await prisma.doseLog.findFirst({
        where: { id: d.id, medication: { patientId: req.user.sub } },
      });
      if (!owned) continue;
      await prisma.doseLog.update({
        where: { id: d.id },
        data:
          d.action === "take"
            ? { status: "taken", takenAt: d.takenAt ? new Date(d.takenAt) : new Date(), pendingSync: false }
            : { status: "skipped", pendingSync: false },
      });
      synced++;
    }
    return { synced };
  });

  // ── Symptoms ──
  app.get("/symptoms", async (req) =>
    prisma.symptomLog.findMany({ where: { patientId: req.user.sub }, orderBy: { timestamp: "desc" } }),
  );
  app.post("/symptoms", async (req, reply) => {
    const body = z
      .object({ symptoms: z.array(z.string()).default([]), mood: z.string().optional(), note: z.string().optional() })
      .parse(req.body);
    const row = await prisma.symptomLog.create({ data: { ...body, patientId: req.user.sub } });
    return reply.code(201).send(row);
  });

  // ── Appointments ──
  app.get("/appointments", async (req) =>
    prisma.appointment.findMany({ where: { patientId: req.user.sub }, orderBy: { date: "asc" } }),
  );
  app.post("/appointments", async (req, reply) => {
    const body = z
      .object({
        doctor: z.string(),
        specialty: z.string().optional(),
        date: z.string(),
        time: z.string(),
        location: z.string().optional(),
        reason: z.string().optional(),
        reminderLead: z.string().optional(),
      })
      .parse(req.body);
    const row = await prisma.appointment.create({
      data: { ...body, date: new Date(body.date), patientId: req.user.sub },
    });
    return reply.code(201).send(row);
  });
  app.delete("/appointments/:id", async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    await prisma.appointment.deleteMany({ where: { id, patientId: req.user.sub } });
    return { ok: true };
  });

  // ── Family / caregivers (owner side: the patient sharing their data) ──
  // The current user is the OWNER (patient). These links describe caregivers they
  // have invited and what each caregiver is allowed to do.
  app.get("/family", async (req) =>
    prisma.familyLink.findMany({
      // Only live links — a broken (revoked) or declined link disappears from the list.
      where: { ownerId: req.user.sub, status: { in: ["invited", "active"] } },
      orderBy: { createdAt: "desc" },
    }),
  );

  app.post("/family/invite", async (req, reply) => {
    const body = z
      .object({
        memberName: z.string(),
        memberPhone: z.string().optional(),
        relationship: z.string().optional(),
        permissions: z.array(z.string()).default([]),
      })
      .parse(req.body);

    const phone = body.memberPhone ? last10(body.memberPhone) : null;
    // If a user with that phone already exists, link them immediately (still
    // "invited" until they accept, but we can match on memberId too).
    const row = await prisma.familyLink.create({
      data: {
        ownerId: req.user.sub,
        memberName: body.memberName,
        memberPhone: phone,
        relationship: body.relationship,
        permissions: sanitizePermissions(body.permissions),
      },
    });

    // Notify the caregiver in-app if they already have an account.
    if (phone) {
      const member = await findUserByLast10(phone);
      const owner = await prisma.user.findUnique({ where: { id: req.user.sub } });
      if (member && member.id !== req.user.sub) {
        await notify({
          userId: member.id,
          kind: "caregiver-invite",
          title: `${owner?.name || "Someone"} invited you as a caregiver`,
          body: "Open SaathiPill → Family to accept and start helping.",
        });
      }
    }
    return reply.code(201).send(row);
  });

  // Update a caregiver's permissions (owner only).
  app.patch("/family/:id", async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({ permissions: z.array(z.string()) }).parse(req.body);
    const link = await prisma.familyLink.findFirst({ where: { id, ownerId: req.user.sub } });
    if (!link) return reply.code(404).send({ error: "Link not found" });
    return prisma.familyLink.update({
      where: { id },
      data: { permissions: sanitizePermissions(body.permissions) },
    });
  });

  // Revoke a caregiver link (owner only).
  app.delete("/family/:id", async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    await prisma.familyLink.updateMany({
      where: { id, ownerId: req.user.sub },
      data: { status: "revoked" },
    });
    return { ok: true };
  });

  // ── Caregiving (member side: acting on someone else's data) ──
  // The current user is the CAREGIVER (member). They see invites addressed to them
  // and, once accepted, the people they care for + permission-gated actions.

  // Pending invites addressed to my phone that I haven't accepted yet.
  app.get("/caregiving/invites", async (req) => {
    const me = await prisma.user.findUnique({ where: { id: req.user.sub } });
    const phone = me ? last10(me.phone) : "";
    if (!phone) return [];
    const links = await prisma.familyLink.findMany({
      where: { memberPhone: phone, memberId: null, status: "invited" },
      orderBy: { createdAt: "desc" },
    });
    const owners = await prisma.user.findMany({
      where: { id: { in: links.map((l) => l.ownerId) } },
      select: { id: true, name: true },
    });
    const nameById = new Map(owners.map((o) => [o.id, o.name]));
    return links.map((l) => ({
      id: l.id,
      ownerId: l.ownerId,
      ownerName: nameById.get(l.ownerId) || "Patient",
      relationship: l.relationship,
      permissions: normalizePermissions(l.permissions),
      createdAt: l.createdAt,
    }));
  });

  // Accept an invite → become the linked member, activate the link.
  app.post("/caregiving/invites/:id/accept", async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const me = await prisma.user.findUnique({ where: { id: req.user.sub } });
    const phone = me ? last10(me.phone) : "";
    const link = await prisma.familyLink.findUnique({ where: { id } });
    if (!link || link.status !== "invited" || link.memberId) {
      return reply.code(404).send({ error: "Invite not available" });
    }
    if (link.ownerId === req.user.sub) return reply.code(400).send({ error: "Cannot care for yourself" });
    // Only the addressed phone may accept (when the invite specified one).
    if (link.memberPhone && link.memberPhone !== phone) {
      return reply.code(403).send({ error: "This invite is for a different phone number" });
    }
    const updated = await prisma.familyLink.update({
      where: { id },
      data: { memberId: req.user.sub, status: "active" },
    });
    const owner = await prisma.user.findUnique({ where: { id: link.ownerId } });
    await notify({
      userId: link.ownerId,
      kind: "caregiver-accepted",
      title: `${me?.name || "Your caregiver"} accepted your invite`,
      body: `They can now help with your medicines${owner ? "" : ""}.`,
    });
    return updated;
  });

  // Decline an invite.
  app.post("/caregiving/invites/:id/decline", async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const me = await prisma.user.findUnique({ where: { id: req.user.sub } });
    const phone = me ? last10(me.phone) : "";
    const link = await prisma.familyLink.findUnique({ where: { id } });
    if (!link || link.status !== "invited") return reply.code(404).send({ error: "Invite not available" });
    if (link.memberPhone && link.memberPhone !== phone) {
      return reply.code(403).send({ error: "This invite is for a different phone number" });
    }
    await prisma.familyLink.update({ where: { id }, data: { status: "declined" } });
    return { ok: true };
  });

  // People I care for (active links where I'm the member), with granted permissions.
  app.get("/caregiving", async (req) => {
    const links = await prisma.familyLink.findMany({
      where: { memberId: req.user.sub, status: "active" },
      orderBy: { createdAt: "desc" },
    });
    const owners = await prisma.user.findMany({
      where: { id: { in: links.map((l) => l.ownerId) } },
      select: { id: true, name: true, phone: true },
    });
    const byId = new Map(owners.map((o) => [o.id, o]));
    return links.map((l) => ({
      linkId: l.id,
      ownerId: l.ownerId,
      ownerName: byId.get(l.ownerId)?.name || "Patient",
      relationship: l.relationship,
      permissions: normalizePermissions(l.permissions),
    }));
  });

  // Patient's schedule + today's doses + adherence, as seen by an authorized caregiver.
  app.get("/caregiving/:linkId/dashboard", async (req, reply) => {
    const link = await authorizeCaregiver(req, reply, PERMISSIONS.VIEW_SCHEDULE);
    if (!link) return;
    const date = ymd(new Date());
    const meds = await prisma.medication.findMany({
      where: { patientId: link.ownerId, active: true },
      include: { doseLogs: { where: { date } } },
    });
    const perms = normalizePermissions(link.permissions);
    let adherence: number | null = null;
    if (perms.includes(PERMISSIONS.VIEW_ADHERENCE)) {
      const last30 = await prisma.doseLog.findMany({
        where: {
          medication: { patientId: link.ownerId },
          date: { gte: ymd(new Date(Date.now() - 30 * 86_400_000)) },
        },
      });
      adherence = adherencePct(last30);
    }
    const owner = await prisma.user.findUnique({ where: { id: link.ownerId }, select: { name: true } });
    return { date, ownerName: owner?.name, permissions: perms, medications: meds, adherence };
  });

  // Per-day adherence series for a cared-for patient.
  app.get("/caregiving/:linkId/adherence/daily", async (req, reply) => {
    const link = await authorizeCaregiver(req, reply, PERMISSIONS.VIEW_ADHERENCE);
    if (!link) return;
    const { days } = z.object({ days: z.coerce.number().default(90) }).parse(req.query);
    const since = ymd(new Date(Date.now() - days * 86_400_000));
    const doses = await prisma.doseLog.findMany({
      where: { medication: { patientId: link.ownerId }, date: { gte: since } },
      select: { date: true, status: true, skipExcluded: true },
    });
    return { days, series: dailyAdherenceSeries(doses) };
  });

  // Appointments + symptoms for a cared-for patient (health info permission).
  app.get("/caregiving/:linkId/health", async (req, reply) => {
    const link = await authorizeCaregiver(req, reply, PERMISSIONS.VIEW_HEALTH);
    if (!link) return;
    const [appointments, symptoms] = await Promise.all([
      prisma.appointment.findMany({ where: { patientId: link.ownerId }, orderBy: { date: "asc" } }),
      prisma.symptomLog.findMany({ where: { patientId: link.ownerId }, orderBy: { timestamp: "desc" }, take: 50 }),
    ]);
    return { appointments, symptoms };
  });

  // Today's doses for a cared-for patient (schedule permission).
  app.get("/caregiving/:linkId/doses", async (req, reply) => {
    const link = await authorizeCaregiver(req, reply, PERMISSIONS.VIEW_SCHEDULE);
    if (!link) return;
    const { date } = z.object({ date: z.string().default(ymd(new Date())) }).parse(req.query);
    return prisma.doseLog.findMany({
      where: { medication: { patientId: link.ownerId }, date },
      include: { medication: true },
    });
  });

  // Add a medicine to a cared-for patient's list (add_medicines permission).
  app.post("/caregiving/:linkId/medications", async (req, reply) => {
    const link = await authorizeCaregiver(req, reply, PERMISSIONS.ADD_MEDICINES);
    if (!link) return;
    const med = req.body as MedPayload;
    const created = await addMedicationForPatient(link.ownerId, med);
    const me = await prisma.user.findUnique({ where: { id: req.user.sub }, select: { name: true } });
    await notify({
      userId: link.ownerId,
      kind: "caregiver-added-med",
      title: "A caregiver added a medicine",
      body: `${me?.name || "Your caregiver"} added ${med?.drug || "a medicine"} to your list.`,
    });
    return reply.code(201).send(created);
  });

  // Mark a dose taken/skipped on a cared-for patient's behalf (mark_doses permission).
  app.patch("/caregiving/:linkId/doses/:doseId", async (req, reply) => {
    const link = await authorizeCaregiver(req, reply, PERMISSIONS.MARK_DOSES);
    if (!link) return;
    const { doseId } = z.object({ doseId: z.string() }).parse(req.params);
    const body = z
      .object({ action: z.enum(["take", "skip"]), skipReason: z.string().optional(), skipExcluded: z.boolean().optional() })
      .parse(req.body);
    const dose = await prisma.doseLog.findFirst({
      where: { id: doseId, medication: { patientId: link.ownerId } },
    });
    if (!dose) return reply.code(404).send({ error: "Dose not found" });
    const updated = await prisma.doseLog.update({
      where: { id: doseId },
      data:
        body.action === "take"
          ? { status: "taken", takenAt: new Date() }
          : { status: "skipped", skipReason: body.skipReason, skipExcluded: !!body.skipExcluded },
    });
    // Let the patient know a caregiver acted for them.
    const me = await prisma.user.findUnique({ where: { id: req.user.sub }, select: { name: true } });
    await notify({
      userId: link.ownerId,
      kind: "caregiver-marked-dose",
      title: body.action === "take" ? "A dose was marked taken" : "A dose was marked skipped",
      body: `${me?.name || "Your caregiver"} updated a dose at ${dose.scheduledTime}.`,
    });
    return updated;
  });

  // ── Pharmacy pushes (prescribe-to-app inbox) ──
  app.get("/pharmacy-pushes", async (req) =>
    prisma.pharmacyPush.findMany({ where: { patientId: req.user.sub }, orderBy: { pushedAt: "desc" } }),
  );

  app.patch("/pharmacy-pushes/:id", async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({ action: z.enum(["accept", "dismiss"]) }).parse(req.body);
    const push = await prisma.pharmacyPush.findFirst({ where: { id, patientId: req.user.sub } });
    if (!push) return reply.code(404).send({ error: "Not found" });

    if (body.action === "accept") {
      const meds = (push.meds as MedPayload[]) || [];
      for (const m of meds) {
        await addMedicationForPatient(req.user.sub, {
          ...m,
          source: { type: "pharmacy", name: push.pharmacyName, code: push.pharmacyCode },
        });
      }
    }
    const status = body.action === "accept" ? "accepted" : "dismissed";
    const updated = await prisma.pharmacyPush.update({ where: { id }, data: { status } });
    emitToPharmacy(push.pharmacyId, "push.updated", updated);
    return updated;
  });

  // ── Refills (patient side) ──
  app.get("/refills", async (req) =>
    prisma.refillOrder.findMany({ where: { patientId: req.user.sub }, orderBy: { placedAt: "desc" } }),
  );
  app.post("/refills", async (req, reply) => {
    const body = z
      .object({
        items: z.array(z.object({ med: z.string(), qty: z.number().int().positive() })),
        pharmacyCode: z.string().optional(),
        amount: z.number().int().optional(), // ignored when we can price from inventory
      })
      .parse(req.body);

    const profile = await prisma.patientProfile.findUnique({ where: { userId: req.user.sub } });
    const code =
      body.pharmacyCode || profile?.linkedPharmacyCode || (profile?.linkedPharmacyCodes ?? [])[0] || null;
    const pharmacy = code ? await prisma.pharmacy.findUnique({ where: { code } }) : null;

    // Stock check + price estimate against the chosen pharmacy's live inventory.
    let amount = body.amount ?? 0;
    if (pharmacy) {
      const inv = await prisma.inventoryItem.findMany({ where: { pharmacyId: pharmacy.id } });
      const byName = new Map(inv.map((i) => [i.name, i]));
      const shortfalls: { med: string; requested: number; available: number }[] = [];
      let total = 0;
      for (const it of body.items) {
        const stockItem = byName.get(it.med);
        const available = stockItem?.stock ?? 0;
        if (available < it.qty) shortfalls.push({ med: it.med, requested: it.qty, available });
        if (stockItem) total += stockItem.mrp * it.qty;
      }
      if (shortfalls.length) return reply.code(409).send({ error: "insufficient_stock", shortfalls });
      const offer = await prisma.offer.findFirst({ where: { pharmacyId: pharmacy.id, active: true } });
      amount = offer ? Math.round(total * (1 - offer.discount / 100)) : total;
    }

    const order = await prisma.refillOrder.create({
      data: {
        displayId: `SP-${Math.floor(1000 + Math.random() * 9000)}`,
        patientId: req.user.sub,
        pharmacyId: pharmacy?.id ?? null,
        items: body.items,
        amount,
      },
    });

    // Ordering a refill resets the supply clock for those medicines: push the
    // refill-due date out a month and clear the reminder so it can fire next cycle.
    const REFILL_CYCLE_DAYS = 30;
    const nextDue = new Date(Date.now() + REFILL_CYCLE_DAYS * 86_400_000);
    for (const it of body.items) {
      await prisma.medication.updateMany({
        where: { patientId: req.user.sub, active: true, drug: { startsWith: String(it.med).split(/\s+\d/)[0].trim() } },
        data: { refillDueAt: nextDue, refillRemindedAt: null },
      });
    }

    if (pharmacy) emitToPharmacy(pharmacy.id, "refill.created", order);
    return reply.code(201).send(order);
  });

  // ── Notifications ──
  app.get("/notifications", async (req) =>
    prisma.notification.findMany({ where: { userId: req.user.sub }, orderBy: { createdAt: "desc" }, take: 50 }),
  );
  app.post("/notifications/:id/read", async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    await prisma.notification.updateMany({ where: { id, userId: req.user.sub }, data: { read: true } });
    return { ok: true };
  });
}
