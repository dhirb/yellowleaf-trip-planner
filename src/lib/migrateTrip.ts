import type {
  Day,
  Flight,
  FlightKind,
  GeoPoint,
  Item,
  ItemKind,
  Lang,
  Stay,
  TripData,
} from "../types";
import { LANGUAGE_PRESETS } from "./languages";
import { addDays, daysBetween } from "./date";
import { isGeoPoint } from "./geo";

/** Current endonym label for each preset code, used to refresh stale stored labels. */
const PRESET_LABEL_BY_CODE = new Map(
  LANGUAGE_PRESETS.map((l) => [l.code, l.label]),
);

/**
 * Re-derive a language's label from the current preset list by code, so trips
 * that persisted an older label (e.g. "简体中文 (Chinese, Simplified)") self-heal
 * to the curated endonym. Unknown codes keep their stored label.
 */
function refreshLabel(lang: Lang): Lang {
  const preset = PRESET_LABEL_BY_CODE.get(lang.code);
  return preset && preset !== lang.label ? { ...lang, label: preset } : lang;
}

/** Legacy input shapes: what old Firestore docs and seed literals carry. */
export type RawItem = Omit<Item, "location"> & {
  local?: string;
  /** Untrusted until `isGeoPoint` says otherwise. */
  location?: unknown;
};
/**
 * Legacy stays carried no dates — they hung off a single day, and a multi-night
 * booking was repeated on each of its days. The dates are optional here so old
 * docs and seed literals still typecheck.
 */
export type RawStay = Omit<Stay, "checkIn" | "checkOut" | "location"> & {
  localName?: string;
  checkIn?: string;
  checkOut?: string;
  /** Untrusted until `isGeoPoint` says otherwise. */
  location?: unknown;
};
/**
 * Legacy flights carried a single kind-dependent `time` and a `kind`
 * (direction) instead of explicit departure/arrival times.
 */
export type RawFlight = Flight & { time?: string; kind?: FlightKind };
export type RawDay = Omit<Day, "items" | "flights"> & {
  items?: RawItem[];
  stay?: RawStay | null;
  flights?: RawFlight[];
};
export type RawTripData = Omit<
  TripData,
  "days" | "languages" | "nativeLang" | "stays"
> & {
  languages?: Lang[];
  nativeLang?: Lang | null;
  days: RawDay[];
  stays?: RawStay[];
  /** Legacy trip-wide fallback accommodation, superseded by `stays`. */
  hotel?: RawStay;
};

const ITEM_KINDS = new Set<ItemKind>([
  "attraction",
  "meal",
  "stay",
  "transport",
  "other",
]);

/**
 * Fold a legacy `local` title into the language's title override, drop a
 * `location` that is not a usable coordinate, and coerce an unknown `kind` to
 * "other" — it drives an icon table and class names on the map.
 */
function migrateItem(item: RawItem, code: string | null): Item {
  const { local, location, ...rest } = item;
  const kind: ItemKind = ITEM_KINDS.has(rest.kind) ? rest.kind : "other";
  const out: Item = isGeoPoint(location)
    ? { ...rest, kind, location }
    : { ...rest, kind };
  if (local && code) {
    const t = { ...(out.t ?? {}) };
    t[code] = { title: local, ...(t[code] ?? {}) };
    return { ...out, t };
  }
  return out;
}

/**
 * Drop the deprecated `kind` (direction) field and fold any legacy single
 * `time` into the departure or arrival slot based on that kind (the old field
 * meant "departs" for departures, "arrives" otherwise). Only fills a slot when
 * neither dep/arr time is set, so it's a no-op for already-migrated flights.
 */
function migrateFlight(flight: RawFlight): Flight {
  const { time, kind, ...rest } = flight;
  if (time && rest.depTime === undefined && rest.arrTime === undefined) {
    return kind === "departure"
      ? { ...rest, depTime: time }
      : { ...rest, arrTime: time };
  }
  return { ...rest };
}

/**
 * Fold a legacy `localName` into the language's name override. Dates, where the
 * stay already has them, pass straight through. A `location` that is not a
 * usable coordinate (hand-edited doc, older shape) is dropped so the map only
 * ever sees points it can place.
 */
type CleanStay = Omit<RawStay, "location"> & { location?: GeoPoint };

function migrateStay(stay: RawStay, code: string | null): CleanStay {
  const { localName, location, city, ...rest } = stay;
  let out: CleanStay = isGeoPoint(location) ? { ...rest, location } : rest;
  // `city` is read with `.trim()` in render paths; a non-string from a
  // hand-edited doc is dropped rather than allowed to throw there.
  if (typeof city === "string") out = { ...out, city };
  if (localName && code) {
    const t = { ...(out.t ?? {}) };
    t[code] = { name: localName, ...(t[code] ?? {}) };
    return { ...out, t };
  }
  return out;
}

/**
 * A stay's content, ignoring dates. Two days that carry an equal key were the
 * same booking, so their nights collapse into one dated stay.
 *
 * Built field-by-field rather than by stringifying the object, so the result
 * can't shift with key order and a missing `desc` reads the same as a blank one.
 */
function stayKey(stay: RawStay): string {
  const t = stay.t ?? {};
  return JSON.stringify([
    stay.name,
    stay.desc ?? "",
    stay.address ?? "",
    stay.phone ?? "",
    stay.note ?? "",
    Object.keys(t)
      .sort()
      .map((code) => [
        code,
        t[code].name ?? "",
        t[code].desc ?? "",
        t[code].note ?? "",
      ]),
  ]);
}

interface StayRun {
  stay: CleanStay;
  key: string;
  checkIn: string;
  lastDate: string;
}

function closeRun(run: StayRun): Stay {
  return {
    ...run.stay,
    checkIn: run.checkIn,
    checkOut: addDays(run.lastDate, 1),
  } as Stay;
}

/**
 * Derive trip-level stays from the legacy per-day `day.stay`. A booking that was
 * repeated across consecutive days collapses into a single entry spanning them:
 * `checkIn` is the first of those days, `checkOut` the day after the last, since
 * the last day carrying a stay is a night slept there.
 *
 * A day with no stay (or a blank-named one, which rendered as nothing anyway)
 * breaks the run, so the same hotel either side of a night elsewhere stays two
 * entries rather than swallowing the gap.
 */
export function staysFromDays(days: RawDay[], code: string | null): Stay[] {
  const out: Stay[] = [];
  let run: StayRun | null = null;

  for (const day of days) {
    const raw = day.stay;
    if (!raw || !raw.name?.trim()) {
      if (run) out.push(closeRun(run));
      run = null;
      continue;
    }
    const stay = migrateStay(raw, code);
    const key = stayKey(stay);
    if (run && run.key === key && daysBetween(run.lastDate, day.date) === 1) {
      run.lastDate = day.date;
      continue;
    }
    if (run) out.push(closeRun(run));
    run = { stay, key, checkIn: day.date, lastDate: day.date };
  }
  if (run) out.push(closeRun(run));
  return out;
}

/**
 * Lift accommodation to the trip level. Already-migrated trips keep their
 * stored `stays` — including an empty list, which is why this tests for the key
 * rather than truthiness: an admin who deletes every stay would otherwise have
 * them resurrected from the legacy days on the next read.
 */
function migrateStays(raw: RawTripData, code: string | null): Stay[] {
  if (raw.stays != null) {
    return raw.stays
      .map((s) => migrateStay(s, code))
      .filter((s): s is CleanStay & { checkIn: string; checkOut: string } =>
        Boolean(s.checkIn && s.checkOut),
      );
  }
  const derived = staysFromDays(raw.days ?? [], code);
  if (derived.length > 0) return derived;

  // Nothing per-day to lift. A trip whose only accommodation was the legacy
  // trip-wide `hotel` spans the whole trip, reproducing what it used to render
  // through the old `day.stay ?? trip.hotel` fallback. No in-app trip reaches
  // this — `hotel` had no editor — but a hand-imported doc might.
  const days = raw.days ?? [];
  if (!raw.hotel?.name?.trim() || days.length === 0) return [];
  return [
    {
      ...migrateStay(raw.hotel, code),
      checkIn: days[0].date,
      checkOut: addDays(days[days.length - 1].date, 1),
    } as Stay,
  ];
}

/**
 * Normalise a stored/seed trip to the current model: derive `languages` and
 * `stays`, fold legacy `local`/`localName` into `t`, and drop deprecated
 * fields. Idempotent — already-migrated trips pass through unchanged.
 */
export function normalizeTrip(raw: RawTripData): TripData {
  const { nativeLang, days, hotel: _hotel, stays: _stays, ...rest } = raw;
  const languages: Lang[] = (
    raw.languages ?? (nativeLang ? [nativeLang] : [])
  ).map(refreshLabel);
  const code = languages[0]?.code ?? null;
  // `hotel` and the per-day `stay` are destructured out purely to strip them:
  // the cast below catches a missing field but would let a stale one through to
  // be re-persisted forever.
  const migratedDays: Day[] = (days ?? []).map(({ stay: _s, ...d }) => ({
    ...d,
    items: (d.items ?? []).map((it) => migrateItem(it, code)),
    flights: (d.flights ?? []).map(migrateFlight),
  }));
  return {
    ...rest,
    coOwnerEmails: raw.coOwnerEmails ?? [],
    languages,
    days: migratedDays,
    stays: migrateStays(raw, code),
  } as TripData;
}
