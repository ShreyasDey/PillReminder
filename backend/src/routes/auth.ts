import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { sendSms } from "../lib/notify.js";
import { issueTokens, rotateRefresh } from "../services/tokens.js";

const OTP_TTL_MS = 5 * 60 * 1000;
const phoneSchema = z.string().min(8).max(20);

function genOtp() {
  return String(Math.floor(1000 + Math.random() * 9000)); // 4-digit
}

export default async function authRoutes(app: FastifyInstance) {
  // Request OTP (signup passes a name; login omits it).
  app.post("/otp/request", async (req, reply) => {
    const body = z.object({ phone: phoneSchema, name: z.string().min(1).optional() }).parse(req.body);
    const code = genOtp();
    await prisma.otpRequest.create({
      data: {
        phone: body.phone,
        code,
        name: body.name ?? null,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });
    await sendSms(body.phone, `Your Arogya code is ${code}. Valid 5 minutes.`);

    // Show the code on screen until a real SMS gateway is configured. Once you set
    // SMS_PROVIDER (e.g. msg91), it's delivered by SMS and no longer revealed here.
    const devReveal = !process.env.SMS_PROVIDER;
    return reply.send({ ok: true, ...(devReveal ? { devCode: code } : {}) });
  });

  // Verify OTP → create user if new → issue tokens.
  app.post("/otp/verify", async (req, reply) => {
    const body = z
      .object({ phone: phoneSchema, code: z.string().length(4), role: z.enum(["patient", "pharmacist"]).optional() })
      .parse(req.body);

    const otp = await prisma.otpRequest.findFirst({
      where: { phone: body.phone, consumed: false },
      orderBy: { createdAt: "desc" },
    });
    if (!otp) return reply.code(400).send({ error: "No OTP requested" });
    if (otp.expiresAt < new Date()) return reply.code(400).send({ error: "Code expired" });
    if (otp.attempts >= 5) return reply.code(429).send({ error: "Too many attempts" });

    if (otp.code !== body.code) {
      await prisma.otpRequest.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
      return reply.code(401).send({ error: "Incorrect code" });
    }

    await prisma.otpRequest.update({ where: { id: otp.id }, data: { consumed: true } });

    // Match the account by DIGITS, not by exact string — "+91 98765 43210",
    // "+91 9876543210" and "9876543210" are all the same person. Without this,
    // a re-formatted phone (e.g. from an invite link) silently creates a
    // duplicate empty account instead of logging the user in.
    let user = await prisma.user.findUnique({ where: { phone: body.phone } });
    if (!user) {
      const digits = body.phone.replace(/\D/g, "").slice(-10);
      if (digits.length === 10) {
        // Full scan + digit compare: stored formats vary too much for a
        // string query. Fine at this scale; index a normalized column later.
        const candidates = await prisma.user.findMany();
        user = candidates.find((u) => u.phone.replace(/\D/g, "").slice(-10) === digits) ?? null;
      }
    }
    const isNew = !user;
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: body.phone,
          name: otp.name || "New user",
          role: body.role ?? "patient",
          profile: body.role === "pharmacist" ? undefined : { create: {} },
        },
      });
    }

    const tokens = await issueTokens(app, user);
    return reply.send({
      ...tokens,
      isNew, // lets the app route to onboarding (new) vs straight home (existing)
      user: { id: user.id, name: user.name, role: user.role, phone: user.phone, pharmacyId: user.pharmacyId },
    });
  });

  app.post("/token/refresh", async (req, reply) => {
    const body = z.object({ refreshToken: z.string() }).parse(req.body);
    const tokens = await rotateRefresh(app, body.refreshToken);
    if (!tokens) return reply.code(401).send({ error: "Invalid refresh token" });
    return reply.send(tokens);
  });

  app.post("/logout", async (req, reply) => {
    const body = z.object({ refreshToken: z.string().optional() }).parse(req.body ?? {});
    if (body.refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: body.refreshToken } });
    }
    return reply.send({ ok: true });
  });
}
