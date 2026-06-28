import type {
  Day,
  Flight,
  FlightKind,
  Item,
  Lang,
  Stay,
  TripData,
} from "../types";
import { LANGUAGE_PRESETS } from "./languages";

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
export type RawItem = Item & { local?: string };
export type RawStay = Stay & { localName?: string };
/**
 * Legacy flights carried a single kind-dependent `time` and a `kind`
 * (direction) instead of explicit departure/arrival times.
 */
export type RawFlight = Flight & { time?: string; kind?: FlightKind };
export type RawDay = Omit<Day, "items" | "stay" | "flights"> & {
  items?: RawItem[];
  stay?: RawStay | null;
  flights?: RawFlight[];
};
export type RawTripData = Omit<
  TripData,
  "days" | "hotel" | "languages" | "nativeLang"
> & {
  languages?: Lang[];
  nativeLang?: Lang | null;
  days: RawDay[];
  hotel: RawStay;
};

/** Fold a legacy `local` title into the language's title override. */
function migrateItem(item: RawItem, code: string | null): Item {
  const { local, ...rest } = item;
  if (local && code) {
    const t = { ...(rest.t ?? {}) };
    t[code] = { title: local, ...(t[code] ?? {}) };
    return { ...rest, t };
  }
  return { ...rest };
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

/** Fold a legacy `localName` into the language's name override. */
function migrateStay(
  stay: RawStay | null | undefined,
  code: string | null,
): Stay | null {
  if (!stay) return null;
  const { localName, ...rest } = stay;
  if (localName && code) {
    const t = { ...(rest.t ?? {}) };
    t[code] = { name: localName, ...(t[code] ?? {}) };
    return { ...rest, t };
  }
  return { ...rest };
}

/**
 * Normalise a stored/seed trip to the current model: derive `languages`,
 * fold legacy `local`/`localName` into `t`, and drop deprecated fields.
 * Idempotent — already-migrated trips pass through unchanged.
 */
export function normalizeTrip(raw: RawTripData): TripData {
  const { nativeLang, days, hotel, ...rest } = raw;
  const languages: Lang[] = (
    raw.languages ?? (nativeLang ? [nativeLang] : [])
  ).map(refreshLabel);
  const code = languages[0]?.code ?? null;
  const migratedDays: Day[] = (days ?? []).map((d) => ({
    ...d,
    items: (d.items ?? []).map((it) => migrateItem(it, code)),
    stay: migrateStay(d.stay, code),
    flights: (d.flights ?? []).map(migrateFlight),
  }));
  return {
    ...rest,
    coOwnerEmails: raw.coOwnerEmails ?? [],
    languages,
    days: migratedDays,
    hotel: migrateStay(hotel, code) ?? hotel,
  } as TripData;
}
