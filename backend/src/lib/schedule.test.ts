import { describe, it, expect } from "vitest";
import { isActiveOn, adherencePct, timeToMinutes, dueDosesFor, dailyAdherenceSeries } from "./schedule.js";

describe("timeToMinutes", () => {
  it("parses 12-hour times", () => {
    expect(timeToMinutes("8:00 AM")).toBe(480);
    expect(timeToMinutes("1:00 PM")).toBe(780);
    expect(timeToMinutes("12:00 AM")).toBe(0);
    expect(timeToMinutes("12:30 PM")).toBe(750);
  });
});

describe("isActiveOn", () => {
  it("daily is always active", () => {
    expect(isActiveOn({ schedule: "daily" }, new Date("2026-06-24"))).toBe(true);
  });

  it("weekly respects weekday set (Wed = 3)", () => {
    const wed = new Date("2026-06-24"); // Wednesday
    expect(isActiveOn({ schedule: "weekly", weeklyDays: [3] }, wed)).toBe(true);
    expect(isActiveOn({ schedule: "weekly", weeklyDays: [1, 2] }, wed)).toBe(false);
  });

  it("fixed course past end date is inactive", () => {
    const day = new Date("2026-06-24");
    expect(
      isActiveOn({ schedule: "daily", courseType: "fixed", courseEndDate: "2026-06-20" }, day),
    ).toBe(false);
    expect(
      isActiveOn({ schedule: "daily", courseType: "fixed", courseEndDate: "2026-06-30" }, day),
    ).toBe(true);
  });

  it("cyclic on/off phases", () => {
    const anchor = "2026-06-01";
    // 21 on / 7 off — day 0..20 active, 21..27 off
    const onDay = new Date("2026-06-10"); // elapsed 9 → on
    const offDay = new Date("2026-06-25"); // elapsed 24 → off
    expect(isActiveOn({ schedule: "cyclic", cyclicOn: 21, cyclicOff: 7, createdAt: anchor }, onDay)).toBe(true);
    expect(isActiveOn({ schedule: "cyclic", cyclicOn: 21, cyclicOff: 7, createdAt: anchor }, offDay)).toBe(false);
  });
});

describe("adherencePct", () => {
  it("returns null with nothing measurable", () => {
    expect(adherencePct([])).toBeNull();
    expect(adherencePct([{ status: "pending" }])).toBeNull();
  });

  it("counts taken / (taken + missed + non-excluded skips)", () => {
    expect(
      adherencePct([
        { status: "taken" },
        { status: "taken" },
        { status: "missed" },
        { status: "skipped" }, // counts against
      ]),
    ).toBe(50);
  });

  it("excluded skips don't count against adherence", () => {
    expect(
      adherencePct([
        { status: "taken" },
        { status: "skipped", skipExcluded: true }, // ignored
      ]),
    ).toBe(100);
  });
});

describe("dailyAdherenceSeries", () => {
  it("returns empty for no doses (new user — no fabricated numbers)", () => {
    expect(dailyAdherenceSeries([])).toEqual([]);
  });

  it("computes real per-day adherence and marks empty days null", () => {
    const series = dailyAdherenceSeries([
      { date: "2026-06-20", status: "taken" },
      { date: "2026-06-20", status: "missed" },
      { date: "2026-06-21", status: "taken" },
      { date: "2026-06-21", status: "taken" },
      { date: "2026-06-22", status: "pending" }, // not yet measurable
    ]);
    expect(series).toEqual([
      { date: "2026-06-20", taken: 1, missed: 1, skipped: 0, counted: 2, pct: 50 },
      { date: "2026-06-21", taken: 2, missed: 0, skipped: 0, counted: 2, pct: 100 },
      { date: "2026-06-22", taken: 0, missed: 0, skipped: 0, counted: 0, pct: null },
    ]);
  });
});

describe("dueDosesFor", () => {
  it("returns active doses sorted chronologically", () => {
    const meds = [
      { id: "a", time: "9:00 PM", schedule: "daily" as const },
      { id: "b", time: "8:00 AM", schedule: "daily" as const },
      { id: "c", time: "1:00 PM", schedule: "weekly" as const, weeklyDays: [0] }, // Sunday only
    ];
    const wed = new Date("2026-06-24");
    const due = dueDosesFor(meds, wed);
    expect(due.map((d) => d.medicationId)).toEqual(["b", "a"]); // c excluded (not Sunday)
  });
});
