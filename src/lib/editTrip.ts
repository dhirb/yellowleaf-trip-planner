import type { ContactKind, Item, Trip } from "../types";
import { addDays, daysBetween } from "./date";

/**
 * Pure, immutable trip-edit operations. Each returns a NEW trip; the input is
 * never mutated (a structured clone is taken first). Ported from the prototype.
 */

function clone(trip: Trip): Trip {
  return structuredClone(trip);
}

export function setTripField<K extends keyof Trip>(trip: Trip, field: K, value: Trip[K]): Trip {
  return { ...trip, [field]: value };
}

export function setDayField(trip: Trip, di: number, field: "theme" | "weather", value: string): Trip {
  const next = clone(trip);
  next.days[di][field] = value;
  return next;
}

export function updateItem(trip: Trip, di: number, ii: number, field: keyof Item, value: string): Trip {
  const next = clone(trip);
  (next.days[di].items[ii][field] as string) = value;
  return next;
}

export function setItemContent(trip: Trip, di: number, ii: number, patch: Partial<Item>): Trip {
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

export function updateFlight(trip: Trip, di: number, fi: number, field: "time" | "flightNo" | "from" | "to", value: string): Trip {
  const next = clone(trip);
  next.days[di].flights[fi][field] = value;
  return next;
}

export function addFlight(trip: Trip, di: number): Trip {
  const next = clone(trip);
  if (!next.days[di].flights) next.days[di].flights = [];
  next.days[di].flights.push({ time: "12:00", flightNo: "", from: "", to: "", kind: "arrival" });
  return next;
}

export function delFlight(trip: Trip, di: number, fi: number): Trip {
  const next = clone(trip);
  next.days[di].flights.splice(fi, 1);
  return next;
}

export function updateStay(trip: Trip, di: number, field: "name" | "desc", value: string): Trip {
  const next = clone(trip);
  const day = next.days[di];
  if (!day.stay) day.stay = { name: "", desc: "", address: "", phone: "" };
  day.stay[field] = value;
  return next;
}

export function updateContact(trip: Trip, ci: number, field: "label" | "value" | "kind", value: string): Trip {
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

export function toggleVisibility(trip: Trip): Trip {
  return { ...trip, visibility: trip.visibility === "public" ? "private" : "public" };
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
    next.days.push({ date: addDays(last, 1), theme: "New day", weather: "", items: [], stay: null, flights: [] });
  }
  while (next.days.length > want) next.days.pop();
  return next;
}
