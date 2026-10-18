import { describe, it, expect } from "vitest";
import { isGeoPoint } from "../src/lib/geo";

describe("isGeoPoint", () => {
  it("accepts a finite lat/lng within range", () => {
    expect(isGeoPoint({ lat: 46.57, lng: 11.67 })).toBe(true);
    expect(isGeoPoint({ lat: -90, lng: 180 })).toBe(true);
  });

  it("rejects out-of-range or non-finite values", () => {
    expect(isGeoPoint({ lat: 91, lng: 0 })).toBe(false);
    expect(isGeoPoint({ lat: 0, lng: -181 })).toBe(false);
    expect(isGeoPoint({ lat: NaN, lng: 0 })).toBe(false);
    expect(isGeoPoint({ lat: Infinity, lng: 0 })).toBe(false);
  });

  it("rejects strings, nulls and partial objects", () => {
    expect(isGeoPoint({ lat: "46.5", lng: "11.6" })).toBe(false);
    expect(isGeoPoint(null)).toBe(false);
    expect(isGeoPoint({ lat: 1 })).toBe(false);
    expect(isGeoPoint("46.5,11.6")).toBe(false);
  });
});
