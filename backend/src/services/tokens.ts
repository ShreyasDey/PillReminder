import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

// Long-lived + rotated on every refresh, so the session stays alive like a normal
// website — the user stays logged in until they log out or clear the browser.
const REFRESH_DAYS = 365;

export async function issueTokens(
  app: FastifyInstance,
  user: { id: string; role: "patient" | "pharmacist"; pharmacyId?: string | null },
) {
  const accessToken = app.jwt.sign({
    sub: user.id,
    role: user.role,
    pharmacyId: user.pharmacyId ?? null,
  });

  const refreshToken = crypto.randomBytes(40).toString("hex");
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_DAYS * 86_400_000),
    },
  });

  return { accessToken, refreshToken };
}

export async function rotateRefresh(app: FastifyInstance, token: string) {
  const existing = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!existing || existing.expiresAt < new Date()) return null;

  await prisma.refreshToken.delete({ where: { token } });
  return issueTokens(app, existing.user);
}
