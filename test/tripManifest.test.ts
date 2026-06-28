import { describe, it, expect } from "vitest";
import { buildTripManifest } from "../src/lib/tripManifest";

const ORIGIN = "https://trips.example.com";

describe("buildTripManifest", () => {
  it("names the app after the trip title", () => {
    const m = buildTripManifest({
      tripId: "abc123",
      title: "Japan 2026",
      origin: ORIGIN,
    });
    expect(m.name).toBe("Japan 2026");
  });

  it("gives each trip its own identity and entry point", () => {
    const m = buildTripManifest({
      tripId: "abc123",
      title: "Japan 2026",
      origin: ORIGIN,
    });
    // A distinct id makes Chrome treat each trip as a separate installable app.
    expect(m.id).toBe("/t/abc123");
    // The installed icon must open the trip, not the generic "/" → /admin.
    expect(m.start_url).toBe(`${ORIGIN}/t/abc123`);
  });

  it("resolves icon and scope URLs absolutely against the origin", () => {
    // Member URLs in a blob: manifest can't resolve relatively, so every URL
    // must be absolute against the document origin.
    const m = buildTripManifest({
      tripId: "abc123",
      title: "Japan 2026",
      origin: ORIGIN,
    });
    expect(m.scope).toBe(`${ORIGIN}/`);
    expect(m.icons.length).toBeGreaterThan(0);
    for (const icon of m.icons) {
      expect(icon.src.startsWith(`${ORIGIN}/`)).toBe(true);
    }
  });

  it("derives a short_name within the PWA length recommendation", () => {
    const m = buildTripManifest({
      tripId: "x",
      title: "A Very Long Grand European Rail Adventure 2026",
      origin: ORIGIN,
    });
    expect(m.short_name.length).toBeLessThanOrEqual(12);
  });

  it("keeps a short title intact as the short_name", () => {
    const m = buildTripManifest({
      tripId: "x",
      title: "Japan 2026",
      origin: ORIGIN,
    });
    expect(m.short_name).toBe("Japan 2026");
  });

  it("falls back to a sensible name when the title is blank", () => {
    const m = buildTripManifest({ tripId: "x", title: "   ", origin: ORIGIN });
    expect(m.name).toBe("Trip Planner");
    expect(m.short_name.length).toBeGreaterThan(0);
  });

  it("trims a trailing origin slash so URLs are not doubled", () => {
    const m = buildTripManifest({
      tripId: "x",
      title: "Japan 2026",
      origin: "https://trips.example.com/",
    });
    expect(m.start_url).toBe("https://trips.example.com/t/x");
    expect(m.scope).toBe("https://trips.example.com/");
  });
});
