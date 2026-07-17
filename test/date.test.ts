import { describe, it, expect } from "vitest";
import {
  addDays,
  daysBetween,
  formatDuration,
  formatTime,
  rangeLabel,
} from "../src/lib/date";

describe("addDays", () => {
  it("adds within a month", () => {
    expect(addDays("2026-11-09", 3)).toBe("2026-11-12");
  });

  it("rolls over a month boundary", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });

  it("rolls over a year boundary", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("handles a leap day", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("subtracts with a negative delta", () => {
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("is a no-op for zero", () => {
    expect(addDays("2026-06-15", 0)).toBe("2026-06-15");
  });
});

describe("daysBetween", () => {
  it("counts whole days forward", () => {
    expect(daysBetween("2026-11-09", "2026-11-12")).toBe(3);
  });

  it("is zero for the same date", () => {
    expect(daysBetween("2026-11-09", "2026-11-09")).toBe(0);
  });

  it("goes negative when b precedes a", () => {
    expect(daysBetween("2026-11-12", "2026-11-09")).toBe(-3);
  });

  it("counts across a year boundary", () => {
    expect(daysBetween("2026-12-30", "2027-01-02")).toBe(3);
  });

  it("is unaffected by a daylight-saving shift", () => {
    // Sydney springs forward on 2026-10-04, making this span 47 real hours —
    // hence the Math.round in daysBetween. Only meaningful because `npm test`
    // pins TZ=Australia/Sydney; under a zone with no shift here (UTC, and so
    // most CI) the span is a clean 48h and this asserts nothing.
    expect(daysBetween("2026-10-03", "2026-10-05")).toBe(2);
  });
});

describe("rangeLabel", () => {
  it("shares the month when both dates fall in it", () => {
    expect(rangeLabel("2026-11-09", "2026-11-12")).toBe("9–12 Nov");
  });

  it("names both months across a boundary", () => {
    expect(rangeLabel("2026-06-30", "2026-07-02")).toBe("30 Jun – 2 Jul");
  });
});

describe("formatTime", () => {
  it("returns 24-hour input unchanged in 24h mode", () => {
    expect(formatTime("14:05", "24h")).toBe("14:05");
    expect(formatTime("09:00", "24h")).toBe("09:00");
    expect(formatTime("00:30", "24h")).toBe("00:30");
  });

  it("converts to 12-hour with meridiem in 12h mode", () => {
    expect(formatTime("14:05", "12h")).toBe("2:05 PM");
    expect(formatTime("09:00", "12h")).toBe("9:00 AM");
    expect(formatTime("17:30", "12h")).toBe("5:30 PM");
  });

  it("handles midnight and noon edge cases in 12h mode", () => {
    expect(formatTime("00:30", "12h")).toBe("12:30 AM");
    expect(formatTime("00:00", "12h")).toBe("12:00 AM");
    expect(formatTime("12:00", "12h")).toBe("12:00 PM");
    expect(formatTime("12:45", "12h")).toBe("12:45 PM");
  });

  it("accepts a single-digit hour", () => {
    expect(formatTime("9:00", "12h")).toBe("9:00 AM");
    expect(formatTime("9:00", "24h")).toBe("9:00");
  });

  it("passes through free-form or non-HH:mm values untouched", () => {
    expect(formatTime("morning", "12h")).toBe("morning");
    expect(formatTime("after lunch", "24h")).toBe("after lunch");
    expect(formatTime("", "12h")).toBe("");
    expect(formatTime("25:99", "12h")).toBe("25:99");
  });
});

describe("formatDuration", () => {
  it("formats hours and minutes", () => {
    expect(formatDuration("02:15")).toBe("2h 15m");
  });

  it("drops minutes for a whole hour", () => {
    expect(formatDuration("01:00")).toBe("1h");
  });

  it("drops hours for a sub-hour duration", () => {
    expect(formatDuration("00:45")).toBe("45m");
  });

  it("handles durations beyond 24 hours", () => {
    expect(formatDuration("30:15")).toBe("30h 15m");
    expect(formatDuration("48:00")).toBe("48h");
  });

  it("shows 0m for a zero duration", () => {
    expect(formatDuration("00:00")).toBe("0m");
  });

  it("returns legacy free-text durations untouched", () => {
    expect(formatDuration("2h 15m")).toBe("2h 15m");
  });
});
