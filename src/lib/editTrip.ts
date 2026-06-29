import type {
  ContactKind,
  DayTranslation,
  Item,
  ItemTranslation,
  Lang,
  StayTranslation,
  Trip,
} from "../types";
import { addDays, daysBetween } from "./date";

/**
 * Pure, immutable trip-edit operations. Each returns a NEW trip; the input is
 * never mutated (a structured clone is taken first). Ported from the prototype.
 */

function clone(trip: Trip): Trip {
  return structuredClone(trip);
}

/**
 * Relocate one element within an array, in place. No-op when `to` is out of
 * range or equal to `from`, so callers can pass `from ± 1` without guarding ends.
 */
function moveInArray<T>(arr: T[], from: number, to: number): void {
  if (to < 0 || to >= arr.length || from === to) return;
  const [el] = arr.splice(from, 1);
  arr.splice(to, 0, el);
}

export function setTripField<K extends keyof Trip>(
  trip: Trip,
  field: K,
  value: Trip[K],
): Trip {
  return { ...trip, [field]: value };
}

export function setDayField(
  trip: Trip,
  di: number,
  field: "theme" | "weather",
  value: string,
): Trip {
  const next = clone(trip);
  next.days[di][field] = value;
  return next;
}

export function updateItem(
  trip: Trip,
  di: number,
  ii: number,
  field: keyof Item,
  value: string,
): Trip {
  const next = clone(trip);
  (next.days[di].items[ii][field] as string) = value;
  return next;
}

export function setItemContent(
  trip: Trip,
  di: number,
  ii: number,
  patch: Partial<Item>,
): Trip {
  const next = clone(trip);
  next.days[di].items[ii] = { ...next.days[di].items[ii], ...patch };
  return next;
}

export function addItem(trip: Trip, di: number): Trip {
  const next = clone(trip);
  next.days[di].items.push({
    kind: "attraction",
    time: "12:00",
    title: "New activity",
    place: "",
    tag: "Activity",
    note: "",
    cost: "",
    tip: "",
    image: "",
  });
  return next;
}

export function delItem(trip: Trip, di: number, ii: number): Trip {
  const next = clone(trip);
  next.days[di].items.splice(ii, 1);
  return next;
}

export function moveItem(
  trip: Trip,
  di: number,
  from: number,
  to: number,
): Trip {
  const next = clone(trip);
  moveInArray(next.days[di].items, from, to);
  return next;
}

/**
 * Index at which an item of the given `time` should slot into a day's
 * (manually-ordered) item list, keeping earlier times first. `Item.time` is a
 * zero-padded `"HH:MM"` string, so plain lexicographic comparison sorts
 * correctly. Ties place the new item before the first later item.
 */
export function timeInsertIndex(items: Item[], time: string): number {
  const at = items.findIndex((it) => it.time > time);
  return at === -1 ? items.length : at;
}

/**
 * Relocate an item to another day (e.g. a last-minute reschedule). The whole
 * item object — including its `t` translation overrides — travels, and it is
 * inserted into the target day by time order. No-op when the source and target
 * are the same day, or when any index is out of range.
 */
export function moveItemToDay(
  trip: Trip,
  fromDi: number,
  ii: number,
  toDi: number,
): Trip {
  if (toDi === fromDi) return trip; // no-op: same day
  const fromItems = trip.days[fromDi]?.items;
  if (!fromItems || !fromItems[ii] || !trip.days[toDi]) return trip;
  const next = clone(trip);
  const [moved] = next.days[fromDi].items.splice(ii, 1);
  const at = timeInsertIndex(next.days[toDi].items, moved.time);
  next.days[toDi].items.splice(at, 0, moved);
  return next;
}

export function updateFlight(
  trip: Trip,
  di: number,
  fi: number,
  field: "depTime" | "arrTime" | "flightNo" | "from" | "to" | "note",
  value: string,
): Trip {
  const next = clone(trip);
  (next.days[di].flights[fi][field] as string) = value;
  return next;
}

export function addLayover(trip: Trip, di: number, fi: number): Trip {
  const next = clone(trip);
  const flight = next.days[di].flights[fi];
  if (!flight.layovers) flight.layovers = [];
  flight.layovers.push({ airport: "", duration: "" });
  return next;
}

export function updateLayover(
  trip: Trip,
  di: number,
  fi: number,
  li: number,
  field: "airport" | "duration",
  value: string,
): Trip {
  const next = clone(trip);
  const layovers = next.days[di].flights[fi].layovers;
  if (!layovers) return trip;
  layovers[li][field] = value;
  return next;
}

export function delLayover(
  trip: Trip,
  di: number,
  fi: number,
  li: number,
): Trip {
  const next = clone(trip);
  next.days[di].flights[fi].layovers?.splice(li, 1);
  return next;
}

export function addFlight(trip: Trip, di: number): Trip {
  const next = clone(trip);
  if (!next.days[di].flights) next.days[di].flights = [];
  next.days[di].flights.push({
    flightNo: "",
    from: "",
    to: "",
    depTime: "12:00",
  });
  return next;
}

export function delFlight(trip: Trip, di: number, fi: number): Trip {
  const next = clone(trip);
  next.days[di].flights.splice(fi, 1);
  return next;
}

export function moveFlight(
  trip: Trip,
  di: number,
  from: number,
  to: number,
): Trip {
  const next = clone(trip);
  moveInArray(next.days[di].flights, from, to);
  return next;
}

export function updateStay(
  trip: Trip,
  di: number,
  field: "name" | "desc" | "address" | "phone" | "note",
  value: string,
): Trip {
  const next = clone(trip);
  const day = next.days[di];
  if (!day.stay) day.stay = { name: "", desc: "", address: "", phone: "" };
  day.stay[field] = value;
  return next;
}

/** Remove a day's accommodation entirely. */
export function clearStay(trip: Trip, di: number): Trip {
  const next = clone(trip);
  next.days[di].stay = null;
  return next;
}

export function updateContact(
  trip: Trip,
  ci: number,
  field: "label" | "value" | "kind" | "color",
  value: string,
): Trip {
  const next = clone(trip);
  if (field === "kind") next.contacts[ci].kind = value as ContactKind;
  else next.contacts[ci][field] = value;
  return next;
}

export function addContact(trip: Trip): Trip {
  const next = clone(trip);
  next.contacts.push({ label: "New contact", value: "", kind: "other" });
  return next;
}

export function delContact(trip: Trip, ci: number): Trip {
  const next = clone(trip);
  next.contacts.splice(ci, 1);
  return next;
}

export function moveContact(trip: Trip, from: number, to: number): Trip {
  const next = clone(trip);
  moveInArray(next.contacts, from, to);
  return next;
}

/** Shift the whole trip so day 0 starts on `newStart`. */
export function setTripStart(trip: Trip, newStart: string): Trip {
  if (!newStart) return trip;
  const delta = daysBetween(trip.days[0].date, newStart);
  if (delta === 0) return trip;
  const next = clone(trip);
  next.days = next.days.map((d) => ({ ...d, date: addDays(d.date, delta) }));
  return next;
}

/** Grow/shrink the trip to end on `newEnd`. Returns null if the date is before the start. */
export function setTripEnd(trip: Trip, newEnd: string): Trip | null {
  if (!newEnd) return trip;
  const start = trip.days[0].date;
  const span = daysBetween(start, newEnd);
  if (span < 0) return null;
  const want = span + 1;
  const next = clone(trip);
  while (next.days.length < want) {
    const last = next.days[next.days.length - 1].date;
    next.days.push({
      date: addDays(last, 1),
      theme: "New day",
      weather: "",
      items: [],
      stay: null,
      flights: [],
    });
  }
  while (next.days.length > want) next.days.pop();
  return next;
}

/** Shallow-merge per-language override maps, immutably. */
function mergeT<V extends object>(
  existing: Record<string, V> | undefined,
  incoming: Record<string, V>,
): Record<string, V> {
  const out: Record<string, V> = { ...(existing ?? {}) };
  for (const code of Object.keys(incoming)) {
    out[code] = { ...(out[code] ?? {}), ...incoming[code] } as V;
  }
  return out;
}

/** Loose email check — good enough to reject obvious typos before storing. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Grant a co-owner by email. Emails are normalised (trim + lowercase) so they
 * match the signed-in user's token email. No-op (returns the input unchanged)
 * when the email is invalid or already present — callers validate separately to
 * surface a toast.
 */
export function addCoOwner(trip: Trip, email: string): Trip {
  const normalized = email.trim().toLowerCase();
  if (!isValidEmail(normalized)) return trip;
  const current = trip.coOwnerEmails ?? [];
  if (current.includes(normalized)) return trip;
  return { ...trip, coOwnerEmails: [...current, normalized] };
}

/** Revoke a co-owner. Matches case-insensitively against the stored email. */
export function removeCoOwner(trip: Trip, email: string): Trip {
  const normalized = email.trim().toLowerCase();
  return {
    ...trip,
    coOwnerEmails: (trip.coOwnerEmails ?? []).filter((e) => e !== normalized),
  };
}

export function addTripLanguage(trip: Trip, lang: Lang): Trip {
  const langs = trip.languages ?? [];
  if (langs.some((l) => l.code === lang.code)) return trip;
  return { ...trip, languages: [...langs, lang] };
}

/** Remove a language and prune its translations from every entity. */
export function removeTripLanguage(trip: Trip, code: string): Trip {
  const next = clone(trip);
  next.languages = (next.languages ?? []).filter((l) => l.code !== code);
  const prune = (e: { t?: Record<string, unknown> } | null | undefined) => {
    if (e?.t) delete e.t[code];
  };
  for (const d of next.days) {
    for (const it of d.items) prune(it);
    prune(d.stay);
    prune(d);
  }
  prune(next.hotel);
  return next;
}

export function setItemTranslations(
  trip: Trip,
  di: number,
  ii: number,
  map: Record<string, ItemTranslation>,
): Trip {
  const next = clone(trip);
  const it = next.days[di].items[ii];
  it.t = mergeT<ItemTranslation>(it.t, map);
  return next;
}

export function setStayTranslations(
  trip: Trip,
  di: number,
  map: Record<string, StayTranslation>,
): Trip {
  const next = clone(trip);
  const stay = next.days[di].stay;
  if (!stay) return trip;
  stay.t = mergeT<StayTranslation>(stay.t, map);
  return next;
}

export function setDayTranslations(
  trip: Trip,
  di: number,
  map: Record<string, DayTranslation>,
): Trip {
  const next = clone(trip);
  next.days[di].t = mergeT<DayTranslation>(next.days[di].t, map);
  return next;
}
