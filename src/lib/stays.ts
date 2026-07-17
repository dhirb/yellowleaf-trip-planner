/**
 * Resolve trip-level accommodation back to a day.
 *
 * Stays live on the trip and carry their own `checkIn`/`checkOut`; the day a
 * traveler is looking at is matched against those ranges here. The nights
 * model — `checkIn <= date < checkOut` — means the check-out date shows no
 * accommodation, matching how a booking confirmation reads.
 *
 * Dates compare as plain ISO strings: "YYYY-MM-DD" sorts chronologically, the
 * same idiom `timeInsertIndex` uses for an item's "HH:MM".
 */

import type { Stay } from "../types";
import { daysBetween } from "./date";

/** True when `date` falls on one of the stay's nights. */
export function stayCovers(stay: Stay, date: string): boolean {
  return stay.checkIn <= date && date < stay.checkOut;
}

/**
 * Index into `stays` of the stay covering `date`, or -1. Ranges should not
 * overlap, but if they do the earliest check-in wins, so the answer never
 * depends on array order.
 */
export function stayIndexForDate(stays: readonly Stay[], date: string): number {
  let best = -1;
  for (let i = 0; i < stays.length; i++) {
    if (!stayCovers(stays[i], date)) continue;
    if (best === -1 || stays[i].checkIn < stays[best].checkIn) best = i;
  }
  return best;
}

/** The stay covering `date`, or null. */
export function stayForDate(stays: readonly Stay[], date: string): Stay | null {
  const i = stayIndexForDate(stays, date);
  return i === -1 ? null : stays[i];
}

/** How many nights the stay covers. */
export function stayNights(stay: Stay): number {
  return daysBetween(stay.checkIn, stay.checkOut);
}

/** Which night of the stay `date` is, 1-based. Only meaningful when covered. */
export function nightOf(stay: Stay, date: string): number {
  return daysBetween(stay.checkIn, date) + 1;
}

/**
 * Stays in check-in order for display, each carrying its index into the
 * original array.
 *
 * Storage order is never sorted: the edit screen addresses a stay by its raw
 * index, so re-ordering on save would silently retarget the open editor at a
 * different booking the moment its dates changed.
 */
export function sortedStays(
  stays: readonly Stay[],
): { stay: Stay; index: number }[] {
  return stays
    .map((stay, index) => ({ stay, index }))
    .sort((a, b) => a.stay.checkIn.localeCompare(b.stay.checkIn));
}

/**
 * True when none of the stay's nights fall on a day of the trip — a booking
 * stranded by the trip's dates moving out from under it.
 *
 * `lastDate` is the trip's final day, which is itself a night: a stay covering
 * it checks out the morning after, one day past the trip. So the comparison is
 * against the nights, not the check-out date.
 */
export function staysOutsideTrip(
  stay: Stay,
  firstDate: string,
  lastDate: string,
): boolean {
  return stay.checkOut <= firstDate || stay.checkIn > lastDate;
}

/**
 * Indices of stays whose nights collide with another's. Back-to-back bookings
 * (one's check-out is the next one's check-in) share no night and are fine.
 */
export function overlappingStayIndices(stays: readonly Stay[]): Set<number> {
  const out = new Set<number>();
  for (let i = 0; i < stays.length; i++) {
    for (let j = i + 1; j < stays.length; j++) {
      const a = stays[i];
      const b = stays[j];
      if (a.checkIn < b.checkOut && b.checkIn < a.checkOut) {
        out.add(i);
        out.add(j);
      }
    }
  }
  return out;
}
