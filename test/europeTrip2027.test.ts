import { describe, it, expect } from "vitest";
import { normalizeTrip, type RawTripData } from "../src/lib/migrateTrip";
import { addDays } from "../src/lib/date";
import {
  overlappingStayIndices,
  sortedStays,
  stayForDate,
  staysOutsideTrip,
} from "../src/lib/stays";
import { europeTrip2027 } from "../src/data/europeTrip2027";
import { ITEM_IMAGES, imageKey } from "../src/data/europeTrip2027/images";

const FIRST_DAY = "2027-08-31";
const LAST_DAY = "2027-09-19";
const DAY_COUNT = 20;
const FIRST_NIGHT_IN_EUROPE = "2027-09-01";
const LAST_NIGHT_IN_EUROPE = "2027-09-17";
const TIME_PATTERN = /^\d{2}:\d{2}$/;
const ZH = "zh-Hans";
/** At least one CJK ideograph — catches English pasted into a translation. */
const HAS_CHINESE = /[一-鿿]/;
const ITEM_FIELDS = ["title", "place", "tag", "note", "tip"] as const;
const STAY_FIELDS = ["name", "desc", "note"] as const;

function trip() {
  const raw: RawTripData = { ...europeTrip2027, ownerId: "test-owner" };
  return normalizeTrip(raw);
}

describe("europeTrip2027 seed data", () => {
  it("covers every calendar day from fly-out to arrival home", () => {
    const { days } = trip();
    expect(days).toHaveLength(DAY_COUNT);
    expect(days[0].date).toBe(FIRST_DAY);
    expect(days[days.length - 1].date).toBe(LAST_DAY);
    days.forEach((day, i) => {
      if (i === 0) return;
      expect(day.date).toBe(addDays(days[i - 1].date, 1));
    });
  });

  it("gives every day a theme, weather field and at least one item", () => {
    for (const day of trip().days) {
      expect(day.theme.trim()).not.toBe("");
      expect(typeof day.weather).toBe("string");
      expect(day.items.length).toBeGreaterThan(0);
    }
  });

  it("uses HH:MM times so items sort and format correctly", () => {
    for (const day of trip().days) {
      for (const item of day.items) {
        expect(item.time).toMatch(TIME_PATTERN);
        expect(item.title.trim()).not.toBe("");
      }
    }
  });

  it("books one stay for every night in Europe, with no gaps or overlaps", () => {
    const { stays, days } = trip();
    expect(stays).toHaveLength(5);
    expect(overlappingStayIndices(stays).size).toBe(0);
    for (const stay of stays) {
      expect(staysOutsideTrip(stay, FIRST_DAY, LAST_DAY)).toBe(false);
    }

    const nights = days
      .map((d) => d.date)
      .filter((d) => d >= FIRST_NIGHT_IN_EUROPE && d <= LAST_NIGHT_IN_EUROPE);
    for (const night of nights) {
      expect(stayForDate(stays, night), `no stay on ${night}`).not.toBeNull();
    }
    // Flight nights are spent in the air, not in a bed.
    expect(stayForDate(stays, FIRST_DAY)).toBeNull();
    expect(stayForDate(stays, "2027-09-18")).toBeNull();
  });

  it("follows the route Munich → Ortisei → Ljubljana → Zell am See → Salzburg", () => {
    const names = sortedStays(trip().stays).map(({ stay }) => stay.name);
    expect(names[0]).toMatch(/Munich/);
    expect(names[1]).toMatch(/Ortisei/);
    expect(names[2]).toMatch(/Ljubljana/);
    expect(names[3]).toMatch(/Zell am See/);
    expect(names[4]).toMatch(/Salzburg/);
  });

  it("carries the outbound and return long-haul flights on the right days", () => {
    const { days } = trip();
    const byDate = new Map(days.map((d) => [d.date, d]));
    const out = byDate.get(FIRST_DAY)!.flights;
    const back = byDate.get("2027-09-18")!.flights;
    expect(out).toHaveLength(1);
    expect(out[0].from).toMatch(/KUL/);
    expect(out[0].to).toMatch(/MUC/);
    expect(back).toHaveLength(1);
    expect(back[0].from).toMatch(/MUC/);
    expect(back[0].to).toMatch(/KUL/);
  });

  it("prices in euros against a New Zealand dollar home currency", () => {
    const { currency } = trip();
    expect(currency.code).toBe("EUR");
    expect(currency.home).toBe("NZD");
    // €1 = NZD 2.00 in the plan, so one NZD buys half a euro.
    expect(currency.perHome).toBe(0.5);
  });

  it("is already in the current model, so normalising is a no-op", () => {
    const once = trip();
    const twice = normalizeTrip({ ...once });
    expect(twice).toEqual(once);
  });
});

describe("europeTrip2027 optional extras", () => {
  const FIRST_EUROPE_DAY = "2027-09-01";
  const LAST_EUROPE_DAY = "2027-09-18";

  it("offers at least one optional extra on every day in Europe", () => {
    for (const day of trip().days) {
      if (day.date < FIRST_EUROPE_DAY || day.date > LAST_EUROPE_DAY) continue;
      const extras = day.items.filter((it) => it.tag === "Optional");
      expect(extras.length, `no extras on ${day.date}`).toBeGreaterThan(0);
      for (const it of extras) {
        expect(it.t?.[ZH]?.tag, `${day.date} "${it.title}"`).toBe("可选");
        expect(
          it.place,
          `${day.date} "${it.title}" needs a distance`,
        ).toBeTruthy();
      }
    }
  });

  it("lists every day's items in time order", () => {
    for (const day of trip().days) {
      const times = day.items.map((it) => it.time);
      expect(times, day.date).toEqual([...times].sort());
    }
  });

  it("never gives two items on a day the same time, so photo keys stay unique", () => {
    for (const day of trip().days) {
      const times = day.items.map((it) => it.time);
      expect(new Set(times).size, day.date).toBe(times.length);
    }
  });
});

describe("europeTrip2027 cover photos", () => {
  const WIKIMEDIA_THUMB =
    // A 960px thumbnail, or the original when the file is smaller than that.
    /^https:\/\/(thumb|upload)\.wikimedia\.org\/wikipedia\/commons\/(thumb\/.+\/960px-[^?]+|[0-9a-f]\/[0-9a-f]{2}\/[^/?]+)$/;

  it("maps every listed photo to a real item, as a clean Wikimedia thumbnail", () => {
    const keys = new Set(
      trip().days.flatMap((d) => d.items.map((it) => imageKey(d.date, it))),
    );
    for (const [key, url] of Object.entries(ITEM_IMAGES)) {
      expect(keys.has(key), `no item at ${key}`).toBe(true);
      expect(url, key).toMatch(WIKIMEDIA_THUMB);
    }
  });

  it("gives every sightseeing item a photo and leaves the rest bare", () => {
    for (const day of trip().days) {
      for (const item of day.items) {
        const label = `${day.date} "${item.title}"`;
        if (item.kind === "attraction") {
          expect(item.image, label).toMatch(WIKIMEDIA_THUMB);
        }
        if (item.kind === "stay" || item.kind === "meal") {
          // Lunch stops with a named place (Hofgarten, Lienz) are the exception.
          if (item.image) expect(item.kind, label).toBe("meal");
        }
      }
    }
  });
});

describe("europeTrip2027 Simplified Chinese translations", () => {
  it("adds Simplified Chinese as the trip's one extra language", () => {
    expect(trip().languages).toEqual([{ code: ZH, label: "简体中文" }]);
  });

  it("translates every day theme", () => {
    for (const day of trip().days) {
      const theme = day.t?.[ZH]?.theme;
      expect(theme, `theme on ${day.date}`).toMatch(HAS_CHINESE);
    }
  });

  it("translates every filled item field and invents none for blank ones", () => {
    for (const day of trip().days) {
      for (const item of day.items) {
        const zh = item.t?.[ZH];
        expect(zh, `${day.date} "${item.title}" has no ${ZH}`).toBeDefined();
        for (const field of ITEM_FIELDS) {
          const base = item[field];
          const label = `${day.date} "${item.title}" ${field}`;
          if (base && base.trim() !== "") {
            expect(zh![field], label).toMatch(HAS_CHINESE);
          } else {
            expect(zh![field], label).toBeUndefined();
          }
        }
      }
    }
  });

  it("translates every filled stay field", () => {
    for (const stay of trip().stays) {
      const zh = stay.t?.[ZH];
      expect(zh, `stay "${stay.name}" has no ${ZH}`).toBeDefined();
      for (const field of STAY_FIELDS) {
        const base = stay[field];
        const label = `stay "${stay.name}" ${field}`;
        if (base && base.trim() !== "") {
          expect(zh![field], label).toMatch(HAS_CHINESE);
        } else {
          expect(zh![field], label).toBeUndefined();
        }
      }
    }
  });
});

describe("europeTrip2027 map pins", () => {
  it("pins every base so the traveler map shows the whole route", () => {
    for (const stay of trip().stays) {
      expect(stay.city?.trim(), stay.name).toBeTruthy();
      expect(stay.location, stay.name).toBeDefined();
    }
  });
});
