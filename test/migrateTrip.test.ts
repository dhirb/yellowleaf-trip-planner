import { describe, it, expect } from "vitest";
import { normalizeTrip, type RawTripData } from "../src/lib/migrateTrip";

function legacy(): RawTripData {
  return {
    ownerId: "u1",
    title: "Kyoto",
    dest: "Kyoto",
    country: "Japan",
    cover: "#fff",
    published: true,
    nativeLang: { code: "ja", label: "日本語" },
    currency: {
      code: "JPY",
      symbol: "¥",
      home: "AUD",
      homeSymbol: "A$",
      perHome: 100,
    },
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
        items: [
          {
            kind: "attraction",
            time: "09:00",
            title: "Kinkaku-ji",
            local: "金閣寺",
          },
        ],
      },
    ],
  } as RawTripData;
}

describe("normalizeTrip", () => {
  it("derives languages from nativeLang", () => {
    expect(normalizeTrip(legacy()).languages).toEqual([
      { code: "ja", label: "日本語" },
    ]);
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

  it("folds a legacy arrival flight time into arrTime, preserving extras", () => {
    const raw = legacy();
    raw.days[0].flights = [
      {
        time: "17:50",
        flightNo: "CZ 350",
        from: "KUL",
        to: "CAN",
        kind: "arrival",
        layovers: [{ airport: "Hong Kong (HKG)", duration: "2h 15m" }],
        note: "Terminal 2.",
      },
    ];
    const f = normalizeTrip(raw).days[0].flights[0];
    expect(f.arrTime).toBe("17:50");
    expect(f.depTime).toBeUndefined();
    expect("time" in f).toBe(false);
    expect(f.layovers).toEqual([
      { airport: "Hong Kong (HKG)", duration: "2h 15m" },
    ]);
    expect(f.note).toBe("Terminal 2.");
  });

  it("folds a legacy departure flight time into depTime", () => {
    const raw = legacy();
    raw.days[0].flights = [
      {
        time: "13:10",
        flightNo: "CZ 8301",
        from: "CAN",
        to: "KUL",
        kind: "departure",
      },
    ];
    const f = normalizeTrip(raw).days[0].flights[0];
    expect(f.depTime).toBe("13:10");
    expect(f.arrTime).toBeUndefined();
  });

  it("drops the deprecated kind field from flights", () => {
    const raw = legacy();
    raw.days[0].flights = [
      {
        flightNo: "QF61",
        from: "SYD",
        to: "KIX",
        kind: "arrival",
        depTime: "09:20",
        arrTime: "14:05",
      },
    ];
    const f = normalizeTrip(raw).days[0].flights[0];
    expect("kind" in f).toBe(false);
    expect(f.depTime).toBe("09:20");
    expect(f.arrTime).toBe("14:05");
  });

  it("leaves already-migrated dep/arr flights unchanged", () => {
    const raw = legacy();
    raw.days[0].flights = [
      {
        flightNo: "QF61",
        from: "SYD",
        to: "KIX",
        depTime: "09:20",
        arrTime: "14:05",
      },
    ];
    expect(normalizeTrip(raw).days[0].flights[0]).toEqual(
      raw.days[0].flights[0],
    );
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

  it("refreshes a stale stored label to the current preset endonym", () => {
    const raw = {
      ...legacy(),
      nativeLang: undefined,
      languages: [{ code: "zh-Hans", label: "简体中文 (Chinese, Simplified)" }],
    } as RawTripData;
    expect(normalizeTrip(raw).languages).toEqual([
      { code: "zh-Hans", label: "简体中文" },
    ]);
  });

  it("keeps the stored label for codes outside the preset list", () => {
    const raw = {
      ...legacy(),
      nativeLang: undefined,
      languages: [{ code: "xx", label: "Custom (Lang)" }],
    } as RawTripData;
    expect(normalizeTrip(raw).languages).toEqual([
      { code: "xx", label: "Custom (Lang)" },
    ]);
  });
});
