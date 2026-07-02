// Background worker: expands daily doses, fires medication reminders that repeat
// until the patient acts, and finalizes past-day misses. Runs as its own process
// so it can be scaled / scheduled independently of the API.

import { prisma } from "../lib/prisma.js";
import { isActiveOn, ymd, timeToMinutes } from "../lib/schedule.js";
import { emitToPatient } from "../lib/realtime.js";
import { sendPushToUser } from "../lib/webpush.js";

const TICK_MS = 60_000; // every minute
const REPEAT_MS = 30 * 60_000; // re-remind every 30 min while a dose stays pending

/** Ensure today's DoseLog rows exist for every active medication due today. */
async function expandTodaysDoses() {
  const today = new Date();
  const date = ymd(today);
  const meds = await prisma.medication.findMany({ where: { active: true } });
  for (const m of meds) {
    if (!isActiveOn({ ...m, courseEndDate: m.courseEndDate, createdAt: m.createdAt }, today)) continue;
    await prisma.doseLog.upsert({
      where: { medicationId_date_scheduledTime: { medicationId: m.id, date, scheduledTime: m.time } },
      create: { medicationId: m.id, date, scheduledTime: m.time },
      update: {},
    });
  }
}

/**
 * Fire reminders for today's due, still-pending doses — and keep firing on a
 * repeat cadence until the patient marks the dose taken or skipped. Snooze pushes
 * the next reminder out via nextRemindAt. Inactive (stopped) medicines are skipped.
 */
async function fireReminders() {
  const now = new Date();
  const date = ymd(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const due = await prisma.doseLog.findMany({
    where: { date, status: "pending", medication: { active: true } },
    include: { medication: true },
  });

  for (const d of due) {
    if (timeToMinutes(d.scheduledTime) > nowMinutes) continue; // not due yet
    if (d.nextRemindAt && d.nextRemindAt > now) continue; // snoozed
    if (d.lastRemindedAt && now.getTime() - d.lastRemindedAt.getTime() < REPEAT_MS) continue; // reminded recently

    const med = d.medication;
    await sendPushToUser(med.patientId, {
      title: `💊 Time for ${med.drug}`,
      body: `${med.dose} • ${d.scheduledTime}${med.meal ? " • " + med.meal : ""}. Tap when you've taken it.`,
      tag: `dose-${d.id}`,
      url: "/",
      requireInteraction: true,
      data: { doseId: d.id, kind: "dose-reminder" },
      actions: [
        { action: "take", title: "✓ Taken" },
        { action: "snooze", title: "Snooze 10m" },
      ],
    });
    emitToPatient(med.patientId, "dose.reminder", {
      doseId: d.id,
      drug: med.drug,
      dose: med.dose,
      time: d.scheduledTime,
      meal: med.meal,
    });
    await prisma.doseLog.update({ where: { id: d.id }, data: { lastRemindedAt: now, nextRemindAt: null } });
  }
}

/** Finalize unacted doses from previous days as missed (today keeps reminding). */
async function finalizeOldDoses() {
  const today = ymd(new Date());
  const stale = await prisma.doseLog.findMany({
    where: { status: "pending", date: { lt: today } },
    include: { medication: true },
  });
  for (const d of stale) {
    const updated = await prisma.doseLog.update({ where: { id: d.id }, data: { status: "missed" } });
    emitToPatient(d.medication.patientId, "dose.updated", updated);
  }
}

async function tick() {
  try {
    await expandTodaysDoses();
    await fireReminders();
    await finalizeOldDoses();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[scheduler] tick error", err);
  }
}

// eslint-disable-next-line no-console
console.log("SaathiPill scheduler started");
void tick();
setInterval(tick, TICK_MS);
