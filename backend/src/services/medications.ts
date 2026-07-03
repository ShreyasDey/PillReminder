// Expands a "med" payload (from the patient Add-Medicine flow or a pharmacy push)
// into Medication rows — one per scheduled time — mirroring the prototype's
// handleAddMed. Also creates today's DoseLog rows for any dose due today.

import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { isActiveOn, ymd, timeToMinutes } from "../lib/schedule.js";

const TIME_MAP: Record<string, string> = {
  morning: "8:00 AM",
  afternoon: "1:00 PM",
  evening: "5:00 PM",
  night: "9:00 PM",
};

export interface MedPayload {
  drug?: string;
  dose?: string;
  times?: string[]; // ['morning', 'custom-...']
  customTimesMap?: Record<string, string> | null;
  meal?: "before" | "after" | "empty" | "bedtime";
  schedule?: "daily" | "weekly" | "cyclic";
  weeklyDays?: number[];
  cyclicOn?: number | null;
  cyclicOff?: number | null;
  courseType?: "ongoing" | "fixed";
  courseDays?: number | null;
  instructions?: string | null;
  source?: { type: string; name: string; code: string } | null;
}

function mealLabel(meal?: string): string | null {
  switch (meal) {
    case "before":
      return "Before meal";
    case "after":
      return "After meal";
    case "empty":
      return "Empty stomach";
    case "bedtime":
      return "At bedtime";
    default:
      return null;
  }
}

// Default supply for an ongoing (chronic) medicine when no explicit quantity is
// captured — a typical monthly refill cycle. Fixed courses use their end date.
const DEFAULT_SUPPLY_DAYS = 30;

export async function addMedicationForPatient(patientId: string, med: MedPayload) {
  const timeMap = { ...TIME_MAP, ...(med.customTimesMap || {}) };
  const courseEndDate =
    med.courseType === "fixed" && med.courseDays
      ? new Date(Date.now() + med.courseDays * 86_400_000)
      : null;
  // When the current supply is estimated to run out → drives refill reminders.
  const refillDueAt = courseEndDate ?? new Date(Date.now() + DEFAULT_SUPPLY_DAYS * 86_400_000);

  const timeIds = med.times && med.times.length > 0 ? med.times : ["morning"];
  const groupId = crypto.randomUUID();

  const times = timeIds
    .map((tid) => timeMap[tid] || "8:00 AM")
    .sort((a, b) => timeToMinutes(a) - timeToMinutes(b));

  const created = await prisma.$transaction(
    times.map((time, idx) =>
      prisma.medication.create({
        data: {
          patientId,
          groupId,
          doseIndex: idx + 1,
          doseTotal: times.length,
          drug: med.drug || "Medicine",
          dose: med.dose || "1 tablet",
          time,
          meal: mealLabel(med.meal),
          schedule: med.schedule || "daily",
          weeklyDays: med.weeklyDays ?? [],
          cyclicOn: med.cyclicOn ?? null,
          cyclicOff: med.cyclicOff ?? null,
          courseType: med.courseType || "ongoing",
          courseDays: med.courseDays ?? null,
          courseEndDate,
          refillDueAt,
          instructions: med.instructions || null,
          source: med.source ?? undefined,
        },
      }),
    ),
  );

  // Create today's dose logs for any that are active today.
  const today = new Date();
  const date = ymd(today);
  for (const m of created) {
    if (isActiveOn({ ...m, courseEndDate: m.courseEndDate, createdAt: m.createdAt }, today)) {
      await prisma.doseLog.upsert({
        where: {
          medicationId_date_scheduledTime: { medicationId: m.id, date, scheduledTime: m.time },
        },
        create: { medicationId: m.id, date, scheduledTime: m.time },
        update: {},
      });
    }
  }

  return created;
}
