import { describe, it, expect } from "vitest";
import type { Stay } from "../src/types";
import {
  nightOf,
  overlappingStayIndices,
  sortedStays,
  stayCovers,
  stayForDate,
  stayIndexForDate,
  stayNights,
  staysOutsideTrip,
} from "../src/lib/stays";

/** Three nights: 9, 10, 11 Nov. Check-out on the 12th. */
const orange: Stay = {
  name: "Orange Hotel",
  checkIn: "2026-11-09",
  checkOut: "2026-11-12",
};

const fairfield: Stay = {
  name: "Fairfield",
  checkIn: "2026-11-12",
  checkOut: "2026-11-14",
};

describe("stayCovers", () => {
  it("covers the check-in date", () => {
    expect(stayCovers(orange, "2026-11-09")).toBe(true);
  });

  it("covers the nights in between", () => {
    expect(stayCovers(orange, "2026-11-10")).toBe(true);
    expect(stayCovers(orange, "2026-11-11")).toBe(true);
  });

  it("does not cover the check-out date", () => {
    expect(stayCovers(orange, "2026-11-12")).toBe(false);
  });

  it("does not cover dates before check-in or after check-out", () => {
    expect(stayCovers(orange, "2026-11-08")).toBe(false);
    expect(stayCovers(orange, "2026-11-13")).toBe(false);
  });

  it("covers nothing when check-out equals check-in", () => {
    const zero: Stay = { ...orange, checkOut: orange.checkIn };
    expect(stayCovers(zero, orange.checkIn)).toBe(false);
  });
});

describe("stayForDate / stayIndexForDate", () => {
  const stays = [orange, fairfield];

  it("hands off on the check-out date", () => {
    expect(stayForDate(stays, "2026-11-11")?.name).toBe("Orange Hotel");
    expect(stayForDate(stays, "2026-11-12")?.name).toBe("Fairfield");
  });

  it("returns null / -1 when no stay covers the date", () => {
    expect(stayForDate(stays, "2026-11-14")).toBe(null);
    expect(stayIndexForDate(stays, "2026-11-14")).toBe(-1);
  });

  it("returns the raw index, not the sorted position", () => {
    expect(stayIndexForDate([fairfield, orange], "2026-11-10")).toBe(1);
  });

  it("resolves an overlap to the earliest check-in, whatever the array order", () => {
    const late: Stay = {
      name: "Late",
      checkIn: "2026-11-10",
      checkOut: "2026-11-13",
    };
    expect(stayForDate([orange, late], "2026-11-11")?.name).toBe(
      "Orange Hotel",
    );
    expect(stayForDate([late, orange], "2026-11-11")?.name).toBe(
      "Orange Hotel",
    );
  });
});

describe("stayNights / nightOf", () => {
  it("counts the nights between check-in and check-out", () => {
    expect(stayNights(orange)).toBe(3);
    expect(stayNights(fairfield)).toBe(2);
  });

  it("numbers each night from 1", () => {
    expect(nightOf(orange, "2026-11-09")).toBe(1);
    expect(nightOf(orange, "2026-11-10")).toBe(2);
    expect(nightOf(orange, "2026-11-11")).toBe(3);
  });
});

describe("sortedStays", () => {
  it("orders by check-in while carrying the raw indices", () => {
    expect(sortedStays([fairfield, orange])).toEqual([
      { stay: orange, index: 1 },
      { stay: fairfield, index: 0 },
    ]);
  });

  it("does not mutate the input", () => {
    const stays = [fairfield, orange];
    sortedStays(stays);
    expect(stays[0].name).toBe("Fairfield");
  });
});

describe("staysOutsideTrip", () => {
  // A trip running 9–11 Nov: three days, and the 11th is itself a night.
  const first = "2026-11-09";
  const last = "2026-11-11";

  it("accepts a stay checking out the morning after the last day", () => {
    const s: Stay = {
      ...orange,
      checkIn: "2026-11-11",
      checkOut: "2026-11-12",
    };
    expect(staysOutsideTrip(s, first, last)).toBe(false);
  });

  it("accepts a stay covering the whole trip", () => {
    expect(staysOutsideTrip(orange, first, last)).toBe(false);
  });

  it("flags a stay whose nights all fall before the trip", () => {
    const s: Stay = {
      ...orange,
      checkIn: "2026-11-07",
      checkOut: "2026-11-09",
    };
    expect(staysOutsideTrip(s, first, last)).toBe(true);
  });

  it("flags a stay starting after the last day", () => {
    const s: Stay = {
      ...orange,
      checkIn: "2026-11-12",
      checkOut: "2026-11-14",
    };
    expect(staysOutsideTrip(s, first, last)).toBe(true);
  });

  it("accepts a stay that only straddles the trip's start", () => {
    const s: Stay = {
      ...orange,
      checkIn: "2026-11-07",
      checkOut: "2026-11-10",
    };
    expect(staysOutsideTrip(s, first, last)).toBe(false);
  });
});

describe("overlappingStayIndices", () => {
  it("treats back-to-back bookings as fine", () => {
    expect(overlappingStayIndices([orange, fairfield]).size).toBe(0);
  });

  it("flags both sides of a real collision", () => {
    const clash: Stay = {
      name: "Clash",
      checkIn: "2026-11-11",
      checkOut: "2026-11-13",
    };
    expect(overlappingStayIndices([orange, clash])).toEqual(new Set([0, 1]));
  });

  it("leaves unrelated stays out of it", () => {
    const clash: Stay = {
      name: "Clash",
      checkIn: "2026-11-11",
      checkOut: "2026-11-13",
    };
    // fairfield (12→14) also collides with clash (11→13), so only a stay well
    // clear of both should stay unflagged.
    const far: Stay = {
      name: "Far",
      checkIn: "2026-11-20",
      checkOut: "2026-11-22",
    };
    expect(overlappingStayIndices([orange, clash, far])).toEqual(
      new Set([0, 1]),
    );
  });
});
