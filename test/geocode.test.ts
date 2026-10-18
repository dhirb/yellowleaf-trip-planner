import { describe, it, expect } from "vitest";
import { parsePlaces, placeSearchUrl, searchPlaces } from "../src/lib/geocode";

/** A trimmed Nominatim `jsonv2` row for Ortisei. */
const ortisei = {
  place_id: 1,
  lat: "46.5747",
  lon: "11.6713",
  name: "Ortisei",
  display_name: "Ortisei, Bolzano, Trentino-Alto Adige, Italy",
  addresstype: "town",
  address: {
    town: "Ortisei",
    county: "Bolzano",
    state: "Trentino-Alto Adige",
    country: "Italy",
    country_code: "it",
  },
};

describe("parsePlaces", () => {
  it("maps a Nominatim row to a Place with numeric coordinates", () => {
    expect(parsePlaces([ortisei])).toEqual([
      {
        name: "Ortisei",
        label: "Ortisei, Trentino-Alto Adige, Italy",
        country: "Italy",
        lat: 46.5747,
        lng: 11.6713,
      },
    ]);
  });

  it("falls back to the address city when there is no name", () => {
    const row = {
      ...ortisei,
      name: "",
      address: { city: "Munich", country: "Germany" },
    };
    expect(parsePlaces([row])[0]).toMatchObject({
      name: "Munich",
      label: "Munich, Germany",
    });
  });

  it("drops rows with unusable coordinates", () => {
    expect(parsePlaces([{ ...ortisei, lat: "abc" }])).toEqual([]);
    expect(parsePlaces([{ ...ortisei, lon: undefined }])).toEqual([]);
  });

  it("drops rows with no usable name at all", () => {
    expect(
      parsePlaces([{ ...ortisei, name: "", display_name: "", address: {} }]),
    ).toEqual([]);
  });

  it("collapses duplicates with the same label", () => {
    const twice = [ortisei, { ...ortisei, place_id: 2, lat: "46.58" }];
    expect(parsePlaces(twice)).toHaveLength(1);
  });

  it("returns [] for a non-array payload", () => {
    expect(parsePlaces(null)).toEqual([]);
    expect(parsePlaces({ error: "x" })).toEqual([]);
  });
});

describe("placeSearchUrl", () => {
  it("targets Nominatim and restricts a settlement search to towns", () => {
    const url = new URL(placeSearchUrl("Zell am See", "settlement"));
    expect(url.origin).toBe("https://nominatim.openstreetmap.org");
    expect(url.pathname).toBe("/search");
    expect(url.searchParams.get("q")).toBe("Zell am See");
    expect(url.searchParams.get("format")).toBe("jsonv2");
    expect(url.searchParams.get("featureType")).toBe("settlement");
    expect(url.searchParams.get("addressdetails")).toBe("1");
  });

  it("leaves the feature type open for an activity search", () => {
    const url = new URL(placeSearchUrl("Deutsches Museum", "any"));
    expect(url.searchParams.has("featureType")).toBe(false);
  });
});

describe("searchPlaces", () => {
  it("resolves [] for a blank query without touching the network", async () => {
    expect(await searchPlaces("   ", "any")).toEqual([]);
  });

  it("resolves null, not [], when the lookup fails", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (() => Promise.reject(new Error("offline"))) as never;
    try {
      expect(await searchPlaces("Ortisei", "settlement")).toBeNull();
    } finally {
      globalThis.fetch = original;
    }
  });

  it("resolves null on a non-2xx response", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (() =>
      Promise.resolve(new Response("busy", { status: 503 }))) as never;
    try {
      expect(await searchPlaces("Ortisei", "settlement")).toBeNull();
    } finally {
      globalThis.fetch = original;
    }
  });
});
