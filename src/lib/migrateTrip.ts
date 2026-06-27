import type { Day, Item, Lang, Stay, TripData } from "../types";

/** Legacy input shapes: what old Firestore docs and seed literals carry. */
export type RawItem = Item & { local?: string };
export type RawStay = Stay & { localName?: string };
export type RawDay = Omit<Day, "items" | "stay"> & {
  items?: RawItem[];
  stay?: RawStay | null;
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

/** Fold a legacy `localName` into the language's name override. */
function migrateStay(stay: RawStay | null | undefined, code: string | null): Stay | null {
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
  const languages: Lang[] = raw.languages ?? (nativeLang ? [nativeLang] : []);
  const code = languages[0]?.code ?? null;
  const migratedDays: Day[] = (days ?? []).map((d) => ({
    ...d,
    items: (d.items ?? []).map((it) => migrateItem(it, code)),
    stay: migrateStay(d.stay, code),
  }));
  return {
    ...rest,
    languages,
    days: migratedDays,
    hotel: migrateStay(hotel, code) ?? hotel,
  } as TripData;
}
