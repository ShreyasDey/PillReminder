// Pure schedule-expansion + adherence logic. No DB, no I/O — unit tested.

export type Schedule = "daily" | "weekly" | "cyclic";
export type CourseType = "ongoing" | "fixed";

export interface MedScheduleInput {
  schedule: Schedule;
  weeklyDays?: number[]; // 0=Sun..6=Sat
  cyclicOn?: number | null;
  cyclicOff?: number | null;
  courseType?: CourseType;
  courseEndDate?: Date | string | null;
  createdAt?: Date | string; // anchor for cyclic phase
}

/** YYYY-MM-DD in local time. */
export function ymd(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function dayDiff(a: Date, b: Date): number {
  const ms =
    Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) -
    Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor(ms / 86_400_000);
}

/**
 * Is a medication "active" (should produce dose entries) on the given day?
 * Handles daily / weekly / cyclic schedules and fixed-course end dates.
 */
export function isActiveOn(med: MedScheduleInput, day: Date): boolean {
  // Fixed course that has ended?
  if (med.courseType === "fixed" && med.courseEndDate) {
    const end = new Date(med.courseEndDate);
    if (dayDiff(day, end) > 0) return false;
  }

  switch (med.schedule) {
    case "daily":
      return true;
    case "weekly": {
      const days = med.weeklyDays ?? [];
      if (days.length === 0) return true; // unspecified → treat as daily
      return days.includes(day.getDay());
    }
    case "cyclic": {
      const on = med.cyclicOn ?? 0;
      const off = med.cyclicOff ?? 0;
      if (on <= 0) return true;
      const anchor = med.createdAt ? new Date(med.createdAt) : day;
      const elapsed = dayDiff(day, anchor);
      if (elapsed < 0) return false;
      const cycle = on + off;
      if (cycle <= 0) return true;
      return elapsed % cycle < on;
    }
    default:
      return true;
  }
}

/** Convert "8:00 AM" → minutes from midnight, for chronological sort/comparison. */
export function timeToMinutes(t: string): number {
  const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return h * 60 + parseInt(m[2], 10);
}

export interface DueDose {
  medicationId: string;
  scheduledTime: string;
  date: string;
}

/**
 * Given a set of medications (each with id, time, and schedule info), return the
 * doses due on `day`, sorted chronologically.
 */
export function dueDosesFor(
  meds: (MedScheduleInput & { id: string; time: string; active?: boolean })[],
  day: Date,
): DueDose[] {
  const date = ymd(day);
  return meds
    .filter((m) => m.active !== false && isActiveOn(m, day))
    .map((m) => ({ medicationId: m.id, scheduledTime: m.time, date }))
    .sort((a, b) => timeToMinutes(a.scheduledTime) - timeToMinutes(b.scheduledTime));
}

export interface DoseForAdherence {
  status: "pending" | "taken" | "skipped" | "missed";
  skipExcluded?: boolean;
}

/**
 * Adherence % = taken / (taken + missed + non-excluded skips).
 * Pending doses and skips flagged `excluded` don't count against the patient.
 * Returns null when there's nothing to measure yet.
 */
export function adherencePct(doses: DoseForAdherence[]): number | null {
  let taken = 0;
  let counted = 0;
  for (const d of doses) {
    if (d.status === "taken") {
      taken++;
      counted++;
    } else if (d.status === "missed") {
      counted++;
    } else if (d.status === "skipped" && !d.skipExcluded) {
      counted++;
    }
    // pending and excluded skips are ignored
  }
  if (counted === 0) return null;
  return Math.round((taken / counted) * 100);
}

export interface DatedDose extends DoseForAdherence {
  date: string; // YYYY-MM-DD
}

export interface DayAdherence {
  date: string;
  taken: number;
  missed: number;
  skipped: number;
  counted: number; // taken + missed + non-excluded skips
  pct: number | null;
}

/**
 * Group dose logs by day and compute per-day adherence. Days with no measurable
 * doses get pct=null (the UI shows them as "no data"), never a fabricated number.
 * Returns ascending by date.
 */
export function dailyAdherenceSeries(doses: DatedDose[]): DayAdherence[] {
  const byDate = new Map<string, DatedDose[]>();
  for (const d of doses) {
    const list = byDate.get(d.date) ?? [];
    list.push(d);
    byDate.set(d.date, list);
  }
  return [...byDate.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, list]) => {
      const taken = list.filter((x) => x.status === "taken").length;
      const missed = list.filter((x) => x.status === "missed").length;
      const skipped = list.filter((x) => x.status === "skipped" && !x.skipExcluded).length;
      const counted = taken + missed + skipped;
      return {
        date,
        taken,
        missed,
        skipped,
        counted,
        pct: counted === 0 ? null : Math.round((taken / counted) * 100),
      };
    });
}
