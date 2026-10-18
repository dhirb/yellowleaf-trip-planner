import { describe, it, expect } from "vitest";
import {
  airportIndex,
  iataOf,
  parseAirports,
  formatAirport,
  searchAirports,
  type Airport,
} from "../src/lib/airports";

const fixture: Airport[] = parseAirports([
  ["KUL", "Kuala Lumpur International Airport", "Kuala Lumpur", "MY"],
  ["KCH", "Kuching International Airport", "Kuching", "MY"],
  ["CAN", "Guangzhou Baiyun International Airport", "Guangzhou", "CN"],
  ["HKG", "Hong Kong International Airport", "Hong Kong", "HK"],
  ["LHR", "London Heathrow Airport", "London", "GB"],
  ["LGW", "London Gatwick Airport", "London", "GB"],
]);

describe("parseAirports", () => {
  it("inflates tuples into records", () => {
    expect(fixture[0]).toEqual({
      iata: "KUL",
      name: "Kuala Lumpur International Airport",
      city: "Kuala Lumpur",
      country: "MY",
    });
  });

  it("carries coordinates when the row has them", () => {
    const [kul] = parseAirports([
      [
        "KUL",
        "Kuala Lumpur International Airport",
        "Kuala Lumpur",
        "MY",
        2.7456,
        101.7099,
      ],
    ]);
    expect(kul).toMatchObject({ lat: 2.7456, lng: 101.7099 });
  });

  it("leaves coordinates off when they are missing or malformed", () => {
    const rows = parseAirports([
      ["AAA", "A", "A", "PF"],
      ["BBB", "B", "B", "PF", NaN, 1],
      ["CCC", "C", "C", "PF", 95, 1],
    ]);
    for (const a of rows) {
      expect(a.lat).toBeUndefined();
      expect(a.lng).toBeUndefined();
    }
  });

  it("drops malformed rows", () => {
    const out = parseAirports([
      ["", "No code", "Nowhere", "XX"],
      ["SIN", "Changi", "Singapore", "SG"],
    ] as never);
    expect(out).toHaveLength(1);
    expect(out[0].iata).toBe("SIN");
  });
});

describe("formatAirport", () => {
  it("formats as 'City (IATA)'", () => {
    expect(formatAirport(fixture[0])).toBe("Kuala Lumpur (KUL)");
  });

  it("falls back to the name when no city is recorded", () => {
    expect(
      formatAirport({
        iata: "XXX",
        name: "Remote Field",
        city: "",
        country: "",
      }),
    ).toBe("Remote Field (XXX)");
  });
});

describe("searchAirports", () => {
  it("returns nothing for a blank query", () => {
    expect(searchAirports(fixture, "   ")).toEqual([]);
  });

  it("matches an exact IATA code first", () => {
    expect(searchAirports(fixture, "kul")[0].iata).toBe("KUL");
  });

  it("ranks an exact code above a city-name match", () => {
    // "CAN" is Guangzhou's code; no city starts with "can", so it leads.
    expect(searchAirports(fixture, "CAN")[0].iata).toBe("CAN");
  });

  it("matches by city name and returns all matches", () => {
    const codes = searchAirports(fixture, "London").map((a) => a.iata);
    expect(codes).toContain("LHR");
    expect(codes).toContain("LGW");
  });

  it("matches a code prefix", () => {
    const codes = searchAirports(fixture, "K").map((a) => a.iata);
    expect(codes).toEqual(expect.arrayContaining(["KUL", "KCH"]));
  });

  it("honours the result limit", () => {
    expect(searchAirports(fixture, "a", 2)).toHaveLength(2);
  });
});

describe("iataOf", () => {
  it("reads the code off a stored 'City (IATA)' label", () => {
    expect(iataOf("Kuala Lumpur (KUL)")).toBe("KUL");
    expect(iataOf("Guangzhou (can) ")).toBe("CAN");
  });

  it("accepts a bare code", () => {
    expect(iataOf("muc")).toBe("MUC");
  });

  it("returns null for free text with no code", () => {
    expect(iataOf("Munich Airport")).toBeNull();
    expect(iataOf("")).toBeNull();
  });
});

describe("airportIndex", () => {
  it("keys airports by upper-case code", () => {
    const index = airportIndex(fixture);
    expect(index.get("KUL")?.city).toBe("Kuala Lumpur");
    expect(index.get("kul")).toBeUndefined();
  });
});
