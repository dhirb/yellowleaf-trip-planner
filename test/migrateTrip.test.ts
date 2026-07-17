import { describe, it, expect } from "vitest";
import {
  normalizeTrip,
  type RawStay,
  type RawTripData,
} from "../src/lib/migrateTrip";
import { addDays } from "../src/lib/date";
import { stayForDate } from "../src/lib/stays";
import { chinaTrip } from "../src/data/chinaTrip";

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

  it("folds stay.localName into t[code].name on the lifted stay", () => {
    const out = normalizeTrip(legacy());
    expect(out.stays[0].t?.ja?.name).toBe("グランヴィア");
    expect("localName" in (out.stays[0] as object)).toBe(false);
  });

  it("drops the per-day stay and the legacy trip-wide hotel", () => {
    const out = normalizeTrip(legacy());
    expect("stay" in (out.days[0] as object)).toBe(false);
    expect("hotel" in (out as object)).toBe(false);
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
    expect(twice.stays).toEqual(once.stays);
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

/** A trip whose days carry `stay`, the shape before stays moved trip-level. */
function withDayStays(stays: (RawStay | null)[], hotel?: RawStay): RawTripData {
  return {
    ...legacy(),
    nativeLang: undefined,
    hotel,
    days: stays.map((stay, i) => ({
      date: addDays("2026-01-01", i),
      theme: `Day ${i + 1}`,
      weather: "",
      flights: [],
      items: [],
      stay,
    })),
  } as RawTripData;
}

describe("normalizeTrip — lifting per-day stays to the trip", () => {
  const granvia: RawStay = { name: "Granvia", desc: "Above the station" };
  const avenida: RawStay = { name: "Avenida" };

  it("collapses a booking repeated across consecutive days into one dated stay", () => {
    const out = normalizeTrip(withDayStays([granvia, granvia, granvia]));
    expect(out.stays).toHaveLength(1);
    expect(out.stays[0]).toMatchObject({
      name: "Granvia",
      checkIn: "2026-01-01",
      // Three nights slept, so check-out is the morning after the last.
      checkOut: "2026-01-04",
    });
  });

  it("keeps the same hotel as two stays when the run is broken", () => {
    const out = normalizeTrip(withDayStays([granvia, avenida, granvia]));
    expect(out.stays.map((s) => [s.name, s.checkIn, s.checkOut])).toEqual([
      ["Granvia", "2026-01-01", "2026-01-02"],
      ["Avenida", "2026-01-02", "2026-01-03"],
      ["Granvia", "2026-01-03", "2026-01-04"],
    ]);
  });

  it("breaks a run on a day with no accommodation", () => {
    const out = normalizeTrip(withDayStays([granvia, null, granvia]));
    expect(out.stays).toHaveLength(2);
    expect(out.stays[0].checkOut).toBe("2026-01-02");
    expect(out.stays[1].checkIn).toBe("2026-01-03");
  });

  it("splits same-name days that differ in any other field", () => {
    const out = normalizeTrip(
      withDayStays([granvia, { ...granvia, note: "Room changed" }]),
    );
    expect(out.stays).toHaveLength(2);
    // Back-to-back, so each day still resolves to exactly one stay.
    expect(out.stays[0].checkOut).toBe(out.stays[1].checkIn);
  });

  it("ignores a blank-named stay, which rendered as nothing anyway", () => {
    expect(normalizeTrip(withDayStays([{ name: "  " }])).stays).toEqual([]);
  });

  it("spans the trip with the legacy hotel when no day carries a stay", () => {
    const out = normalizeTrip(withDayStays([null, null], granvia));
    expect(out.stays).toEqual([
      {
        name: "Granvia",
        desc: "Above the station",
        checkIn: "2026-01-01",
        checkOut: "2026-01-03",
      },
    ]);
  });

  it("prefers the per-day stays over the legacy hotel", () => {
    const out = normalizeTrip(withDayStays([avenida, avenida], granvia));
    expect(out.stays.map((s) => s.name)).toEqual(["Avenida"]);
  });

  it("never re-derives when the trip already stores stays", () => {
    // An admin who deletes every stay writes `[]`; re-deriving would resurrect
    // them from the legacy days on the next read.
    const raw = { ...withDayStays([granvia, granvia]), stays: [] };
    expect(normalizeTrip(raw as RawTripData).stays).toEqual([]);
  });

  it("drops a stored stay that never got dates", () => {
    const raw = { ...withDayStays([]), stays: [granvia] };
    expect(normalizeTrip(raw as RawTripData).stays).toEqual([]);
  });
});

describe("normalizeTrip — the real china trip", () => {
  // The seed was hand-authored with per-base comments ("3 nights ... Nov 9–12").
  // Migrating it should reproduce exactly those bookings.
  const out = normalizeTrip({ ...chinaTrip, ownerId: "u1" } as RawTripData);

  it("lifts each base into one dated stay", () => {
    expect(out.stays.map((s) => [s.checkIn, s.checkOut])).toEqual([
      ["2026-11-09", "2026-11-12"],
      ["2026-11-12", "2026-11-14"],
      ["2026-11-14", "2026-11-15"],
      ["2026-11-15", "2026-11-16"],
    ]);
  });

  it("leaves the departure day with no accommodation", () => {
    // The old `day.stay ?? trip.hotel` fallback showed the Guangzhou hotel here,
    // four days after checking out of it.
    const last = out.days[out.days.length - 1];
    expect(last.date).toBe("2026-11-16");
    expect(stayForDate(out.stays, last.date)).toBe(null);
  });

  it("covers every other day of the trip", () => {
    const uncovered = out.days
      .map((d) => d.date)
      .filter((date) => date !== "2026-11-16")
      .filter((date) => stayForDate(out.stays, date) === null);
    expect(uncovered).toEqual([]);
  });
});
