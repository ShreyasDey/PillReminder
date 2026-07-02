// Browser Web Push delivery. Reaches the patient's phone/desktop even when the
// SaathiPill tab is closed, as long as they granted notification permission and
// their browser has a live push subscription stored.

import webpush from "web-push";
import { prisma } from "./prisma.js";

const PUBLIC = process.env.VAPID_PUBLIC_KEY || "";
const PRIVATE = process.env.VAPID_PRIVATE_KEY || "";
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:care@saathipill.in";

export const vapidPublicKey = PUBLIC;
const configured = Boolean(PUBLIC && PRIVATE);
if (configured) webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);

export interface PushPayload {
  title: string;
  body?: string;
  tag?: string; // replace key — a new reminder for the same dose replaces the old one
  url?: string; // where a click should open
  requireInteraction?: boolean; // keep on screen until the user acts (reminders)
  data?: Record<string, unknown>;
  actions?: { action: string; title: string }[];
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!configured) return;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (!subs.length) return;
  const body = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
      } catch (err: unknown) {
        // 404/410 mean the subscription is dead — drop it so we stop trying.
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) {
          await prisma.pushSubscription.delete({ where: { endpoint: s.endpoint } }).catch(() => {});
        }
      }
    }),
  );
}
