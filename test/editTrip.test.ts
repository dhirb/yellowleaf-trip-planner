import { describe, it, expect } from "vitest";
import type { Currency, Trip } from "../src/types";
import { moveContact, moveFlight, moveItem } from "../src/lib/editTrip";
import {
  addTripLanguage,
  removeTripLanguage,
  setItemTranslations,
  setStayTranslations,
  setDayTranslations,
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
    visibility: "public",
    password: "",
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
          { time: "07:00", flightNo: "F0", from: "", to: "", kind: "arrival" },
          {
            time: "20:00",
            flightNo: "F1",
            from: "",
            to: "",
            kind: "departure",
          },
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

describe("moveFlight", () => {
  it("moves a flight down and up", () => {
    expect(flightNos(moveFlight(fixture(), 0, 0, 1))).toEqual(["F1", "F0"]);
    expect(flightNos(moveFlight(fixture(), 0, 1, 0))).toEqual(["F1", "F0"]);
  });

  it("is a no-op when target index is out of range", () => {
    expect(flightNos(moveFlight(fixture(), 0, 1, 2))).toEqual(["F0", "F1"]);
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
