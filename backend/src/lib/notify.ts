// Notification delivery seam.
// Today everything is in-app (a DB row + a realtime event). To reach a closed
// phone later, implement `deliverExternal` with FCM/APNs (push) and an Indian
// SMS gateway (MSG91/Gupshup) for OTP + caregiver alerts. Nothing else changes.

import { prisma } from "./prisma.js";
import { emitToPatient } from "./realtime.js";
import { sendPushToUser } from "./webpush.js";

export interface NotifyInput {
  userId: string;
  kind: string;
  title: string;
  body?: string;
}

export async function notify(input: NotifyInput) {
  const row = await prisma.notification.create({ data: input });
  emitToPatient(input.userId, "notification", row);
  await deliverExternal(input);
  return row;
}

async function deliverExternal(input: NotifyInput) {
  // Browser Web Push (works when the app is closed). SMS via MSG91 can be added
  // here later for users who haven't enabled push.
  await sendPushToUser(input.userId, { title: input.title, body: input.body, tag: input.kind });
}

/** OTP/SMS seam. In dev we log the code; in prod plug a gateway here. */
export async function sendSms(phone: string, message: string) {
  if (process.env.SMS_PROVIDER === "msg91") {
    // TODO(prod): call MSG91 here with a DLT-registered template.
  }
  // Dev fallback: log so you can see the code during testing.
  // eslint-disable-next-line no-console
  console.log(`[SMS→${phone}] ${message}`);
}
