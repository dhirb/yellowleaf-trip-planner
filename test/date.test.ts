import { describe, it, expect } from "vitest";
import { formatDuration, formatTime } from "../src/lib/date";

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
