// Pharmacist account + pharmacy onboarding.
// These routes are available to any logged-in pharmacist — INCLUDING one who
// hasn't created a pharmacy yet — so they're separate from the main portal
// routes (which require an assigned pharmacy).

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { issueTokens } from "../services/tokens.js";
import { sendPushToUser, vapidPublicKey } from "../lib/webpush.js";

const CODE_RE = /^[A-Z0-9]{4}-[A-Z0-9]{5}$/;

function randomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const pick = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${pick(4)}-${pick(5)}`;
}

export default async function portalAccountRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.requirePharmacist);

  // Who am I + which pharmacy am I running (null if not set up yet).
  app.get("/me", async (req) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      include: { pharmacy: true },
    });
    return {
      id: user?.id,
      name: user?.name,
      role: user?.role,
      pharmacy: user?.pharmacy ?? null,
    };
  });

  // ── Web Push (desktop notifications: restock reminders, new orders) ──
  // Same contract as the patient app's /api/push/* but for pharmacist accounts.
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
      title: "Portal notifications are on ✅",
      body: "You'll get restock reminders and new-order alerts here, even with the tab closed.",
      tag: "test",
    });
    return { ok: true };
  });

  // List pharmacies this pharmacist owns/runs (currently one active at a time).
  app.get("/pharmacies", async (req) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.sub }, include: { pharmacy: true } });
    return user?.pharmacy ? [user.pharmacy] : [];
  });

  // Create a new pharmacy and make it this pharmacist's active store.
  // Re-issues the JWT because it now carries the new pharmacyId.
  app.post("/pharmacies", async (req, reply) => {
    const body = z
      .object({
        name: z.string().min(2),
        location: z.string().optional(),
        hours: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        code: z.string().optional(),
      })
      .parse(req.body);

    let code = (body.code || "").toUpperCase();
    if (code) {
      if (!CODE_RE.test(code)) return reply.code(400).send({ error: "Code must look like ABCD-12345" });
      const clash = await prisma.pharmacy.findUnique({ where: { code } });
      if (clash) return reply.code(409).send({ error: "That pharmacy code is already taken" });
    } else {
      // Generate a unique code.
      do {
        code = randomCode();
      } while (await prisma.pharmacy.findUnique({ where: { code } }));
    }

    const pharmacy = await prisma.pharmacy.create({
      data: { name: body.name, location: body.location, hours: body.hours, lat: body.lat, lng: body.lng, code },
    });

    const user = await prisma.user.update({
      where: { id: req.user.sub },
      data: { pharmacyId: pharmacy.id },
    });

    // New token with the pharmacyId baked in.
    const tokens = await issueTokens(app, user);
    return reply.code(201).send({ pharmacy, ...tokens });
  });
}
