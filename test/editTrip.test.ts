import { describe, it, expect } from "vitest";
import type { Currency, Trip } from "../src/types";
import {
  moveContact,
  moveFlight,
  moveItem,
  moveItemToDay,
  timeInsertIndex,
} from "../src/lib/editTrip";
import {
  addTripLanguage,
  removeTripLanguage,
  setItemTranslations,
  setDayTranslations,
  addCoOwner,
  removeCoOwner,
  isValidEmail,
  addLayover,
  updateLayover,
  delLayover,
  updateFlight,
  updateStay,
} from "../src/lib/editTrip";

const currency: Currency = {
  code: "JPY",
  symbol: "¥",
  home: "AUD",
  homeSymbol: "A$",
  perHome: 100,
};

/** Minimal valid trip: one day with 3 items + 2 flights, and 3 contacts. */
function fixture(): Trip {
  return {
    id: "t1",
    ownerId: "u1",
    title: "Test",
    dest: "Tokyo",
    country: "Japan",
    cover: "#fff",
    published: true,
    languages: [],
    currency,
    hotel: { name: "" },
    contacts: [
      { label: "C0", value: "", kind: "other" },
      { label: "C1", value: "", kind: "other" },
      { label: "C2", value: "", kind: "other" },
    ],
    phrases: [],
    days: [
      {
        date: "2026-01-01",
        theme: "Day 1",
        weather: "",
        stay: null,
        items: [
          { kind: "attraction", time: "09:00", title: "A0" },
          { kind: "attraction", time: "10:00", title: "A1" },
          { kind: "attraction", time: "11:00", title: "A2" },
        ],
        flights: [
          { arrTime: "07:00", flightNo: "F0", from: "", to: "" },
          { depTime: "20:00", flightNo: "F1", from: "", to: "" },
        ],
      },
    ],
  };
}

const itemTitles = (t: Trip) => t.days[0].items.map((i) => i.title);
const flightNos = (t: Trip) => t.days[0].flights.map((f) => f.flightNo);
const contactLabels = (t: Trip) => t.contacts.map((c) => c.label);

describe("moveItem", () => {
  it("moves an item up", () => {
    const next = moveItem(fixture(), 0, 2, 1);
    expect(itemTitles(next)).toEqual(["A0", "A2", "A1"]);
  });

  it("moves an item down", () => {
    const next = moveItem(fixture(), 0, 0, 1);
    expect(itemTitles(next)).toEqual(["A1", "A0", "A2"]);
  });

  it("is a no-op when target index is out of range", () => {
    expect(itemTitles(moveItem(fixture(), 0, 0, -1))).toEqual([
      "A0",
      "A1",
      "A2",
    ]);
    expect(itemTitles(moveItem(fixture(), 0, 2, 3))).toEqual([
      "A0",
      "A1",
      "A2",
    ]);
  });

  it("does not mutate the input trip", () => {
    const trip = fixture();
    const before = structuredClone(trip);
    const next = moveItem(trip, 0, 0, 2);
    expect(trip).toEqual(before);
    expect(next).not.toBe(trip);
  });
});

/** Two contiguous days, so an item can be relocated across them. */
function twoDayFixture(): Trip {
  const t = fixture();
  t.days = [
    {
      date: "2026-01-01",
      theme: "Day 1",
      weather: "",
      stay: null,
      flights: [],
      items: [
        { kind: "attraction", time: "09:00", title: "A0" },
        { kind: "attraction", time: "10:00", title: "A1" },
        { kind: "attraction", time: "11:00", title: "A2" },
      ],
    },
    {
      date: "2026-01-02",
      theme: "Day 2",
      weather: "",
      stay: null,
      flights: [],
      items: [
        { kind: "attraction", time: "08:00", title: "B0" },
        { kind: "attraction", time: "12:00", title: "B1" },
      ],
    },
  ];
  return t;
}

const dayTitles = (t: Trip, di: number) => t.days[di].items.map((i) => i.title);

describe("timeInsertIndex", () => {
  const items = [
    { kind: "attraction" as const, time: "08:00", title: "B0" },
    { kind: "attraction" as const, time: "12:00", title: "B1" },
  ];

  it("returns 0 for an empty list", () => {
    expect(timeInsertIndex([], "10:00")).toBe(0);
  });

  it("returns 0 when the time is earliest", () => {
    expect(timeInsertIndex(items, "07:00")).toBe(0);
  });

  it("returns the length when the time is latest", () => {
    expect(timeInsertIndex(items, "23:00")).toBe(2);
  });

  it("returns the middle index for an in-between time", () => {
    expect(timeInsertIndex(items, "10:00")).toBe(1);
  });
});

describe("moveItemToDay", () => {
  it("removes the item from the source day", () => {
    const next = moveItemToDay(twoDayFixture(), 0, 1, 1);
    expect(dayTitles(next, 0)).toEqual(["A0", "A2"]);
  });

  it("inserts the moved item into the target day by time order", () => {
    // A1 (10:00) slots between B0 (08:00) and B1 (12:00).
    const next = moveItemToDay(twoDayFixture(), 0, 1, 1);
    expect(dayTitles(next, 1)).toEqual(["B0", "A1", "B1"]);
  });

  it("appends when the moved item's time is latest in the target day", () => {
    const trip = twoDayFixture();
    trip.days[0].items[2].time = "23:00"; // A2 later than every day-2 item
    const next = moveItemToDay(trip, 0, 2, 1);
    expect(dayTitles(next, 1)).toEqual(["B0", "B1", "A2"]);
  });

  it("carries the item's translation map to the new day", () => {
    const trip = twoDayFixture();
    trip.days[0].items[1].t = { ja: { title: "A1-ja" } };
    const next = moveItemToDay(trip, 0, 1, 1);
    const moved = next.days[1].items.find((i) => i.title === "A1");
    expect(moved?.t).toEqual({ ja: { title: "A1-ja" } });
  });

  it("is a no-op when source and target are the same day", () => {
    const next = moveItemToDay(twoDayFixture(), 0, 1, 0);
    expect(dayTitles(next, 0)).toEqual(["A0", "A1", "A2"]);
  });

  it("is a no-op when the item or day index is out of range", () => {
    expect(dayTitles(moveItemToDay(twoDayFixture(), 0, 9, 1), 1)).toEqual([
      "B0",
      "B1",
    ]);
    expect(dayTitles(moveItemToDay(twoDayFixture(), 0, 0, 9), 0)).toEqual([
      "A0",
      "A1",
      "A2",
    ]);
  });

  it("does not mutate the input trip", () => {
    const trip = twoDayFixture();
    const before = structuredClone(trip);
    const next = moveItemToDay(trip, 0, 1, 1);
    expect(trip).toEqual(before);
    expect(next).not.toBe(trip);
  });
});

describe("moveFlight", () => {
  it("moves a flight down and up", () => {
    expect(flightNos(moveFlight(fixture(), 0, 0, 1))).toEqual(["F1", "F0"]);
    expect(flightNos(moveFlight(fixture(), 0, 1, 0))).toEqual(["F1", "F0"]);
  });

  it("is a no-op when target index is out of range", () => {
    expect(flightNos(moveFlight(fixture(), 0, 1, 2))).toEqual(["F0", "F1"]);
  });
});

describe("layover helpers", () => {
  it("adds a layover to a flight, initialising the array", () => {
    const t = addLayover(fixture(), 0, 0);
    expect(t.days[0].flights[0].layovers).toEqual([
      { airport: "", duration: "" },
    ]);
  });

  it("appends additional layovers in order", () => {
    let t = addLayover(fixture(), 0, 0);
    t = addLayover(t, 0, 0);
    t = updateLayover(t, 0, 0, 0, "airport", "HKG");
    t = updateLayover(t, 0, 0, 1, "airport", "PVG");
    expect(t.days[0].flights[0].layovers?.map((l) => l.airport)).toEqual([
      "HKG",
      "PVG",
    ]);
  });

  it("updates a layover field", () => {
    let t = addLayover(fixture(), 0, 0);
    t = updateLayover(t, 0, 0, 0, "duration", "2h 15m");
    expect(t.days[0].flights[0].layovers?.[0]).toEqual({
      airport: "",
      duration: "2h 15m",
    });
  });

  it("removes a layover by index", () => {
    let t = addLayover(fixture(), 0, 0);
    t = addLayover(t, 0, 0);
    t = updateLayover(t, 0, 0, 0, "airport", "HKG");
    t = updateLayover(t, 0, 0, 1, "airport", "PVG");
    t = delLayover(t, 0, 0, 0);
    expect(t.days[0].flights[0].layovers?.map((l) => l.airport)).toEqual([
      "PVG",
    ]);
  });

  it("does not mutate the input trip", () => {
    const trip = fixture();
    const before = structuredClone(trip);
    const next = addLayover(trip, 0, 0);
    expect(trip).toEqual(before);
    expect(next).not.toBe(trip);
  });

  it("returns the trip unchanged when updating a missing layover array", () => {
    const base = fixture();
    expect(updateLayover(base, 0, 0, 0, "airport", "HKG")).toBe(base);
  });
});

describe("updateFlight", () => {
  it("sets the optional note field", () => {
    const t = updateFlight(fixture(), 0, 0, "note", "Terminal 2; long lines.");
    expect(t.days[0].flights[0].note).toBe("Terminal 2; long lines.");
  });

  it("sets departure and arrival times independently", () => {
    let t = updateFlight(fixture(), 0, 0, "depTime", "09:30");
    t = updateFlight(t, 0, 0, "arrTime", "17:50");
    expect(t.days[0].flights[0]).toMatchObject({
      depTime: "09:30",
      arrTime: "17:50",
    });
  });
});

describe("updateStay", () => {
  it("sets address, phone, and note on a fresh stay", () => {
    let t = updateStay(fixture(), 0, "name", "Orange Hotel");
    t = updateStay(t, 0, "address", "解放北路960号");
    t = updateStay(t, 0, "phone", "+86 20 1234 5678");
    t = updateStay(t, 0, "note", "2 rooms, cash only.");
    expect(t.days[0].stay).toMatchObject({
      name: "Orange Hotel",
      address: "解放北路960号",
      phone: "+86 20 1234 5678",
      note: "2 rooms, cash only.",
    });
  });

  it("does not mutate the input trip", () => {
    const trip = fixture();
    const before = structuredClone(trip);
    updateStay(trip, 0, "address", "somewhere");
    expect(trip).toEqual(before);
  });
});

describe("moveContact", () => {
  it("moves a contact up", () => {
    expect(contactLabels(moveContact(fixture(), 2, 1))).toEqual([
      "C0",
      "C2",
      "C1",
    ]);
  });

  it("is a no-op when target index is out of range", () => {
    expect(contactLabels(moveContact(fixture(), 0, -1))).toEqual([
      "C0",
      "C1",
      "C2",
    ]);
  });

  it("does not mutate the input trip", () => {
    const trip = fixture();
    const before = structuredClone(trip);
    moveContact(trip, 0, 2);
    expect(trip).toEqual(before);
  });
});

describe("language helpers", () => {
  it("adds a language without duplicating", () => {
    const t = addTripLanguage(fixture(), { code: "ja", label: "日本語" });
    expect(t.languages).toEqual([{ code: "ja", label: "日本語" }]);
    expect(
      addTripLanguage(t, { code: "ja", label: "日本語" }).languages,
    ).toHaveLength(1);
  });

  it("merges item translations without dropping other languages", () => {
    let t = setItemTranslations(fixture(), 0, 0, { ja: { title: "あ" } });
    t = setItemTranslations(t, 0, 0, { fr: { title: "A" } });
    expect(t.days[0].items[0].t).toEqual({
      ja: { title: "あ" },
      fr: { title: "A" },
    });
  });

  it("removing a language prunes its translations everywhere", () => {
    let t = addTripLanguage(fixture(), { code: "ja", label: "日本語" });
    t = setItemTranslations(t, 0, 0, { ja: { title: "あ" } });
    t = setDayTranslations(t, 0, { ja: { theme: "日" } });
    t = removeTripLanguage(t, "ja");
    expect(t.languages).toEqual([]);
    expect(t.days[0].items[0].t?.ja).toBeUndefined();
    expect(t.days[0].t?.ja).toBeUndefined();
  });

  it("does not mutate the input trip", () => {
    const base = fixture();
    addTripLanguage(base, { code: "ja", label: "日本語" });
    expect(base.languages).toEqual([]);
  });
});

describe("co-owner helpers", () => {
  it("validates email format", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("  a@b.co  ")).toBe(true);
    expect(isValidEmail("nope")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });

  it("adds a co-owner, normalising case and whitespace", () => {
    const t = addCoOwner(fixture(), "  Friend@Example.COM ");
    expect(t.coOwnerEmails).toEqual(["friend@example.com"]);
  });

  it("does not duplicate an existing co-owner regardless of case", () => {
    let t = addCoOwner(fixture(), "friend@example.com");
    t = addCoOwner(t, "FRIEND@example.com");
    expect(t.coOwnerEmails).toEqual(["friend@example.com"]);
  });

  it("returns the trip unchanged for an invalid email", () => {
    const base = fixture();
    const t = addCoOwner(base, "not-an-email");
    expect(t).toBe(base);
  });

  it("removes a co-owner, matching case-insensitively", () => {
    let t = addCoOwner(fixture(), "friend@example.com");
    t = removeCoOwner(t, "Friend@Example.com");
    expect(t.coOwnerEmails).toEqual([]);
  });

  it("does not mutate the input trip", () => {
    const base = fixture();
    addCoOwner(base, "friend@example.com");
    expect(base.coOwnerEmails).toBeUndefined();
  });
});
