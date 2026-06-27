import { describe, it, expect } from "vitest";
import { normalizeTrip, type RawTripData } from "../src/lib/migrateTrip";

function legacy(): RawTripData {
  return {
    ownerId: "u1",
    title: "Kyoto",
    dest: "Kyoto",
    country: "Japan",
    cover: "#fff",
    visibility: "public",
    password: "",
    published: true,
    nativeLang: { code: "ja", label: "日本語" },
    currency: { code: "JPY", symbol: "¥", home: "AUD", homeSymbol: "A$", perHome: 100 },
    hotel: { name: "Granvia", localName: "グランヴィア" },
    contacts: [],
    phrases: [{ en: "Hello", local: "Konnichiwa", pron: "kon" }],
    days: [
      {
        date: "2026-01-01",
        theme: "Arrival",
        weather: "",
        flights: [],
        stay: { name: "Granvia", localName: "グランヴィア" },
        items: [{ kind: "attraction", time: "09:00", title: "Kinkaku-ji", local: "金閣寺" }],
      },
    ],
  } as RawTripData;
}

describe("normalizeTrip", () => {
  it("derives languages from nativeLang", () => {
    expect(normalizeTrip(legacy()).languages).toEqual([{ code: "ja", label: "日本語" }]);
  });

  it("folds item.local into t[code].title and drops local", () => {
    const item = normalizeTrip(legacy()).days[0].items[0];
    expect(item.t?.ja?.title).toBe("金閣寺");
    expect("local" in item).toBe(false);
  });

  it("folds stay.localName and hotel.localName into t[code].name", () => {
    const out = normalizeTrip(legacy());
    expect(out.days[0].stay?.t?.ja?.name).toBe("グランヴィア");
    expect(out.hotel.t?.ja?.name).toBe("グランヴィア");
    expect("localName" in (out.days[0].stay as object)).toBe(false);
  });

  it("leaves the phrasebook untouched", () => {
    expect(normalizeTrip(legacy()).phrases[0].local).toBe("Konnichiwa");
  });

  it("drops nativeLang from output", () => {
    expect("nativeLang" in normalizeTrip(legacy())).toBe(false);
  });

  it("is idempotent for already-migrated trips", () => {
    const once = normalizeTrip(legacy());
    const twice = normalizeTrip(once as unknown as RawTripData);
    expect(twice.languages).toEqual(once.languages);
    expect(twice.days[0].items[0].t?.ja?.title).toBe("金閣寺");
  });

  it("defaults languages to [] when absent", () => {
    const raw = { ...legacy(), nativeLang: undefined };
    expect(normalizeTrip(raw).languages).toEqual([]);
  });
});
