// Background worker: expands daily doses, fires medication reminders that repeat
// until the patient acts, and finalizes past-day misses. Runs as its own process
// so it can be scaled / scheduled independently of the API.

import { prisma } from "../lib/prisma.js";
import { isActiveOn, ymd, timeToMinutes } from "../lib/schedule.js";
import { emitToPatient } from "../lib/realtime.js";
import { sendPushToUser } from "../lib/webpush.js";
import { notify } from "../lib/notify.js";
import { computeDemand7d } from "../lib/demand.js";

const TICK_MS = 60_000; // every minute
const REPEAT_MS = 30 * 60_000; // re-remind every 30 min while a dose stays pending
const REFILL_LEAD_DAYS = 7; // remind this many days before the supply runs out

/** Parse a reminder lead like "1d" / "2h" / "30m" into milliseconds (default 1 day). */
function parseLeadMs(lead: string | null): number {
  const m = (lead || "").match(/^(\d+)\s*([dhm])$/i);
  if (!m) return 86_400_000;
  const n = parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  return n * (u === "d" ? 86_400_000 : u === "h" ? 3_600_000 : 60_000);
}

/** Combine an appointment's date with its "3:30 PM" time string into a Date. */
function appointmentDateTime(date: Date, time: string): Date {
  const dt = new Date(date);
  const m = (time || "").match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m) {
    let h = parseInt(m[1], 10) % 12;
    if (m[3].toUpperCase() === "PM") h += 12;
    dt.setHours(h, parseInt(m[2], 10), 0, 0);
  }
  return dt;
}

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

/**
 * Fire a one-time reminder for each upcoming doctor appointment, at (appointment
 * time − reminderLead). `remindedAt` guards against re-sending.
 */
async function fireAppointmentReminders() {
  const now = new Date();
  const appts = await prisma.appointment.findMany({ where: { remindedAt: null } });
  for (const a of appts) {
    const when = appointmentDateTime(a.date, a.time);
    if (when.getTime() <= now.getTime()) continue; // already passed
    if (now.getTime() < when.getTime() - parseLeadMs(a.reminderLead)) continue; // too early
    const whenLabel = when.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
    await notify({
      userId: a.patientId,
      kind: "appointment-reminder",
      title: `📅 Appointment: ${a.doctor}`,
      body: `${a.specialty ? a.specialty + " · " : ""}${whenLabel} at ${a.time}${a.location ? " · " + a.location : ""}`,
    });
    emitToPatient(a.patientId, "appointment.reminder", { id: a.id, doctor: a.doctor, specialty: a.specialty, date: a.date, time: a.time, location: a.location, reason: a.reason });
    await prisma.appointment.update({ where: { id: a.id }, data: { remindedAt: now } });
  }
}

/**
 * Fire a one-time refill reminder per medicine (grouped by drug) when its estimated
 * supply is within REFILL_LEAD_DAYS of running out. Cleared/reset when a refill is
 * ordered, so it recurs each cycle.
 */
async function fireRefillReminders() {
  const now = new Date();
  const soon = new Date(now.getTime() + REFILL_LEAD_DAYS * 86_400_000);
  const meds = await prisma.medication.findMany({
    where: { active: true, refillRemindedAt: null, refillDueAt: { not: null, lte: soon } },
    orderBy: { refillDueAt: "asc" },
  });
  const seenGroup = new Set<string>();
  for (const m of meds) {
    const key = m.patientId + "|" + m.groupId;
    // Only one reminder per medicine (a drug can have several dose-time rows).
    if (!seenGroup.has(key)) {
      seenGroup.add(key);
      const daysLeft = Math.max(0, Math.ceil((m.refillDueAt!.getTime() - now.getTime()) / 86_400_000));
      await notify({
        userId: m.patientId,
        kind: "refill-reminder",
        title: `🔁 Time to refill ${m.drug}`,
        body: daysLeft <= 0
          ? `Your ${m.drug} has run out — reorder now so you don't miss a dose.`
          : `About ${daysLeft} day${daysLeft === 1 ? "" : "s"} of ${m.drug} left — reorder now to stay covered.`,
      });
      emitToPatient(m.patientId, "refill.reminder", { drug: m.drug, dose: m.dose, daysLeft });
    }
    await prisma.medication.update({ where: { id: m.id }, data: { refillRemindedAt: now } });
  }
}

// In-memory throttle so each pharmacy gets at most one restock reminder per day.
const lowStockNotified = new Set<string>();

/**
 * Restock reminders for pharmacists: for each pharmacy, compare live stock against
 * demand learned from real ordering data (counter sales + app refill orders) and
 * send one consolidated reminder per day when items won't cover the coming week.
 */
async function notifyLowStock() {
  const today = ymd(new Date());
  const pharmacies = await prisma.pharmacy.findMany({ select: { id: true, name: true } });
  for (const ph of pharmacies) {
    const key = ph.id + "|" + today;
    if (lowStockNotified.has(key)) continue;
    const demand = await computeDemand7d(ph.id);
    const inv = await prisma.inventoryItem.findMany({ where: { pharmacyId: ph.id } });
    const low = inv.filter((i) => {
      const d = demand.get(i.name) ?? 0;
      return d > 0 && i.stock <= d; // real demand, and stock won't cover ~a week
    });
    if (!low.length) continue;
    const pharmacists = await prisma.user.findMany({
      where: { pharmacyId: ph.id, role: "pharmacist" },
      select: { id: true },
    });
    if (!pharmacists.length) continue;
    const names = low.slice(0, 5).map((i) => i.name).join(", ");
    const body = `${low.length} item${low.length === 1 ? "" : "s"} low on stock vs recent demand: ${names}${low.length > 5 ? "…" : ""}. Reorder to avoid stockouts.`;
    for (const p of pharmacists) {
      await notify({ userId: p.id, kind: "low-stock", title: "📦 Restock reminder", body });
    }
    lowStockNotified.add(key);
  }
}

async function tick() {
  try {
    await expandTodaysDoses();
    await fireReminders();
    await fireAppointmentReminders();
    await fireRefillReminders();
    await notifyLowStock();
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
