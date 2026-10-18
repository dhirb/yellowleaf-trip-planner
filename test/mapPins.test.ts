import { describe, it, expect } from "vitest";
import type { Day, Flight, Stay } from "../src/types";
import { airportIndex, parseAirports } from "../src/lib/airports";
import { dayPins, localAirport, routePins } from "../src/lib/mapPins";

const munich: Stay = {
  name: "Moxy Munich Messe",
  city: "Munich",
  location: { lat: 48.1374, lng: 11.5755 },
  checkIn: "2027-09-01",
  checkOut: "2027-09-04",
  t: { "zh-Hans": { name: "慕尼黑 Moxy" } },
};

const ortisei: Stay = {
  name: "Ortisei apartment",
  city: "Ortisei",
  location: { lat: 46.5747, lng: 11.6713 },
  checkIn: "2027-09-04",
  checkOut: "2027-09-07",
};

/** No location — a stay the admin never pinned. */
const unpinned: Stay = {
  name: "Mystery hotel",
  checkIn: "2027-09-07",
  checkOut: "2027-09-09",
};

describe("routePins", () => {
  it("orders pins by check-in and numbers them from 1", () => {
    const pins = routePins({ stays: [ortisei, munich] }, "en");
    expect(pins.map((p) => p.label)).toEqual(["Munich", "Ortisei"]);
    expect(pins.map((p) => p.order)).toEqual([1, 2]);
  });

  it("keeps the raw stay index so a pin can be traced back", () => {
    const pins = routePins({ stays: [ortisei, munich] }, "en");
    expect(pins[0].stayIndex).toBe(1);
    expect(pins[0].id).toBe("stay:1");
    expect(pins[1].stayIndex).toBe(0);
  });

  it("skips stays without a location", () => {
    const pins = routePins({ stays: [munich, unpinned, ortisei] }, "en");
    expect(pins).toHaveLength(2);
  });

  it("carries coordinates, dates and the night count", () => {
    const [pin] = routePins({ stays: [munich] }, "en");
    expect(pin).toMatchObject({
      kind: "city",
      lat: 48.1374,
      lng: 11.5755,
      checkIn: "2027-09-01",
      checkOut: "2027-09-04",
      nights: 3,
    });
  });

  it("localizes the stay name but never the city", () => {
    const [pin] = routePins({ stays: [munich] }, "zh-Hans");
    expect(pin.name).toBe("慕尼黑 Moxy");
    expect(pin.label).toBe("Munich");
  });

  it("falls back to the stay name when the city is blank", () => {
    const [pin] = routePins({ stays: [{ ...ortisei, city: "" }] }, "en");
    expect(pin.label).toBe("Ortisei apartment");
  });

  it("returns [] for a trip with no stays", () => {
    expect(routePins({ stays: [] }, "en")).toEqual([]);
  });
});

const airports = airportIndex(
  parseAirports([
    [
      "KUL",
      "Kuala Lumpur International Airport",
      "Kuala Lumpur",
      "MY",
      2.7456,
      101.7099,
    ],
    ["MUC", "Munich Airport", "Munich", "DE", 48.3538, 11.7861],
    ["XXX", "No Coordinates Field", "Nowhere", "ZZ"],
  ]),
);

const inbound: Flight = {
  flightNo: "MH1",
  from: "Kuala Lumpur (KUL)",
  to: "Munich (MUC)",
};
const outbound: Flight = {
  flightNo: "MH2",
  from: "Munich (MUC)",
  to: "Kuala Lumpur (KUL)",
};

describe("localAirport", () => {
  const nearMunich = munich.location!;

  it("picks the end nearer to where the traveler sleeps", () => {
    expect(localAirport(inbound, airports, nearMunich)?.iata).toBe("MUC");
    expect(localAirport(outbound, airports, nearMunich)?.iata).toBe("MUC");
  });

  it("defaults to the destination without an anchor", () => {
    expect(localAirport(inbound, airports, null)?.iata).toBe("MUC");
    expect(localAirport(outbound, airports, null)?.iata).toBe("KUL");
  });

  it("uses whichever end resolves when the other is unknown", () => {
    const f: Flight = { flightNo: "X", from: "Somewhere", to: "Munich (MUC)" };
    expect(localAirport(f, airports, null)?.iata).toBe("MUC");
    const g: Flight = { flightNo: "X", from: "Munich (MUC)", to: "Nowhere" };
    expect(localAirport(g, airports, null)?.iata).toBe("MUC");
  });

  it("measures longitude the short way round the antimeridian", () => {
    const near = airportIndex(
      parseAirports([
        ["AAA", "West of the line", "West", "ZZ", 0, 165],
        ["BBB", "East of the line", "East", "ZZ", 0, -175],
      ]),
    );
    const f: Flight = { flightNo: "X", from: "West (AAA)", to: "East (BBB)" };
    // From 179°E, -175° is 6° away across the line; 165° is 14° away. Read
    // naively, -175° would look 354° away and the wrong end would win.
    expect(localAirport(f, near, { lat: 0, lng: 179 })?.iata).toBe("BBB");
    expect(localAirport(f, near, { lat: 0, lng: 170 })?.iata).toBe("AAA");
  });

  it("ignores an airport the dataset has no coordinates for", () => {
    const f: Flight = { flightNo: "X", from: "Nowhere (XXX)", to: "Elsewhere" };
    expect(localAirport(f, airports, null)).toBeNull();
  });
});

function day(partial: Partial<Day> & { date: string }): Day {
  return { theme: "", weather: "", items: [], flights: [], ...partial };
}

const arrival = day({
  date: "2027-09-01",
  flights: [inbound],
  items: [
    { kind: "transport", time: "07:00", title: "Land", place: "MUC" },
    {
      kind: "attraction",
      time: "15:00",
      title: "Riemer Park",
      location: { lat: 48.1335, lng: 11.6895 },
      t: { "zh-Hans": { title: "Riemer 公园" } },
    },
    {
      kind: "meal",
      time: "18:30",
      title: "Dinner at Riem Arcaden",
      location: { lat: 48.1329, lng: 11.695 },
    },
  ],
});
const departure = day({ date: "2027-09-04", flights: [outbound] });
const trip = { days: [arrival, departure], stays: [munich] };

describe("dayPins", () => {
  it("pins the local airport, each located item and the night's stay", () => {
    const pins = dayPins(trip, 0, "en", airports);
    expect(pins.map((p) => [p.id, p.kind, p.label])).toEqual([
      ["flight:0", "airport", "Munich (MUC)"],
      ["item:1", "attraction", "Riemer Park"],
      ["item:2", "meal", "Dinner at Riem Arcaden"],
      ["stay", "stay", "Moxy Munich Messe"],
    ]);
  });

  it("leaves off items without a location", () => {
    const ids = dayPins(trip, 0, "en", airports).map((p) => p.id);
    expect(ids).not.toContain("item:0");
  });

  it("localizes pin labels", () => {
    const pins = dayPins(trip, 0, "zh-Hans", airports);
    expect(pins.find((p) => p.id === "item:1")?.label).toBe("Riemer 公园");
    expect(pins.find((p) => p.id === "stay")?.label).toBe("慕尼黑 Moxy");
  });

  it("anchors a departure day on where the traveler woke up", () => {
    // 4 Sep: checked out of Munich that morning; no stay covers the date.
    const pins = dayPins(trip, 1, "en", airports);
    expect(pins.map((p) => p.id)).toEqual(["flight:0"]);
    expect(pins[0].label).toBe("Munich (MUC)");
  });

  it("keeps a flight home on the trip's side when no stay is pinned", () => {
    // No stays at all; the only located thing is an activity on another day.
    const noStays = { days: [arrival, departure], stays: [] };
    const pins = dayPins(noStays, 1, "en", airports);
    expect(pins[0]?.label).toBe("Munich (MUC)");
  });

  it("skips flights while the airport dataset is still loading", () => {
    const ids = dayPins(trip, 0, "en", null).map((p) => p.id);
    expect(ids).toEqual(["item:1", "item:2", "stay"]);
  });

  it("returns [] for an unknown day", () => {
    expect(dayPins(trip, 9, "en", airports)).toEqual([]);
  });
});
