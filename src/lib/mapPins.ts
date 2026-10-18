/**
 * Derive map pins from the trip.
 *
 * Two maps read from here. The route map (day one) pins each located stay as a
 * numbered city in check-in order, so the pins read as the journey: 1 → 2 → 3.
 * Each day's map pins what that day touches: its accommodation, every located
 * activity, and the local end of any flight. Nothing is ever guessed — an item
 * or stay without a `location` is simply left off.
 */

import type { Flight, GeoPoint, Stay, Trip } from "../types";
import {
  formatAirport,
  iataOf,
  type Airport,
  type AirportIndex,
} from "./airports";
import { localizeItem, localizeStay } from "./localize";
import { sortedStays, stayForDate, stayNights } from "./stays";

export type PinKind =
  "city" | "stay" | "attraction" | "meal" | "transport" | "other" | "airport";

export interface Pin {
  /** Stable key — also how a tapped pin is traced back to its card. */
  id: string;
  kind: PinKind;
  label: string;
  lat: number;
  lng: number;
  /** 1-based position along the route; city pins only. */
  order?: number;
}

/** A numbered base on the route map. */
export interface RoutePin extends Pin {
  kind: "city";
  order: number;
  /** Index into `trip.stays`. */
  stayIndex: number;
  /** Localized accommodation name. */
  name: string;
  checkIn: string;
  checkOut: string;
  nights: number;
}

type Located<T extends { location?: GeoPoint }> = T & { location: GeoPoint };

function isLocated<T extends { location?: GeoPoint }>(x: T): x is Located<T> {
  return x.location != null;
}

/** Pins for every located stay, in check-in order. */
export function routePins(trip: Pick<Trip, "stays">, lang: string): RoutePin[] {
  return sortedStays(trip.stays)
    .filter((row): row is { stay: Located<Stay>; index: number } =>
      isLocated(row.stay),
    )
    .map(({ stay, index }, i) => {
      const name = localizeStay(stay, lang).name;
      return {
        id: `stay:${index}`,
        kind: "city",
        order: i + 1,
        stayIndex: index,
        label: stay.city?.trim() || name,
        name,
        lat: stay.location.lat,
        lng: stay.location.lng,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        nights: stayNights(stay),
      };
    });
}

/**
 * Squared equirectangular distance — only ever compared, never displayed, so
 * the cheap approximation is plenty.
 */
function closeness(a: GeoPoint, b: GeoPoint): number {
  const midLat = ((a.lat + b.lat) / 2) * (Math.PI / 180);
  const dLat = a.lat - b.lat;
  // Take the short way round the antimeridian (179° and -179° are 2° apart).
  let dLng = a.lng - b.lng;
  if (dLng > 180) dLng -= 360;
  else if (dLng < -180) dLng += 360;
  dLng *= Math.cos(midLat);
  return dLat * dLat + dLng * dLng;
}

function lookup(airports: AirportIndex, label: string): Airport | null {
  const code = iataOf(label);
  const airport = code ? airports.get(code) : undefined;
  return airport && airport.lat != null && airport.lng != null ? airport : null;
}

/**
 * The end of a flight that belongs on this day's map: the one nearer to
 * `anchor` (where the traveler sleeps around that day). A flight home is
 * pinned at the airport they leave from, a flight in at the one they land at.
 * Without an anchor the destination wins. Null when neither end resolves.
 */
export function localAirport(
  flight: Flight,
  airports: AirportIndex,
  anchor: GeoPoint | null,
): Airport | null {
  const from = lookup(airports, flight.from);
  const to = lookup(airports, flight.to);
  if (!from || !to) return to ?? from;
  if (!anchor) return to;
  const fromPoint = { lat: from.lat!, lng: from.lng! };
  const toPoint = { lat: to.lat!, lng: to.lng! };
  return closeness(fromPoint, anchor) < closeness(toPoint, anchor) ? from : to;
}

/**
 * Where the traveler is based around a day: that night's stay, else the stay
 * they woke up in (a departure morning), else the first located activity that
 * day, else anywhere at all the trip is pinned — so a flight home still lands
 * on the trip's side of the world even when no stay is pinned.
 */
function anchorFor(
  trip: Pick<Trip, "days" | "stays">,
  dayIndex: number,
): GeoPoint | null {
  const day = trip.days[dayIndex];
  const tonight = stayForDate(trip.stays, day.date)?.location;
  if (tonight) return tonight;
  const prev = trip.days[dayIndex - 1];
  const lastNight = prev && stayForDate(trip.stays, prev.date)?.location;
  if (lastNight) return lastNight;
  const today = (day.items ?? []).find(isLocated)?.location;
  if (today) return today;
  const anyStay = trip.stays.find(isLocated)?.location;
  if (anyStay) return anyStay;
  for (const d of trip.days) {
    const item = (d.items ?? []).find(isLocated);
    if (item) return item.location;
  }
  return null;
}

/**
 * Pins for one day: the local airport of each flight, every located activity
 * in time order, then the night's accommodation. `airports` may be null while
 * the dataset is still loading, in which case flights are left off.
 */
export function dayPins(
  trip: Pick<Trip, "days" | "stays">,
  dayIndex: number,
  lang: string,
  airports: AirportIndex | null,
): Pin[] {
  const day = trip.days[dayIndex];
  if (!day) return [];
  const pins: Pin[] = [];

  if (airports) {
    const anchor = anchorFor(trip, dayIndex);
    (day.flights ?? []).forEach((flight, i) => {
      const airport = localAirport(flight, airports, anchor);
      if (!airport) return;
      pins.push({
        id: `flight:${i}`,
        kind: "airport",
        label: formatAirport(airport),
        lat: airport.lat!,
        lng: airport.lng!,
      });
    });
  }

  (day.items ?? []).forEach((raw, i) => {
    if (!isLocated(raw)) return;
    const item = localizeItem(raw, lang);
    pins.push({
      id: `item:${i}`,
      kind: item.kind,
      label: item.title,
      lat: raw.location.lat,
      lng: raw.location.lng,
    });
  });

  const stay = stayForDate(trip.stays, day.date);
  if (stay && isLocated(stay)) {
    pins.push({
      id: "stay",
      kind: "stay",
      label: localizeStay(stay, lang).name,
      lat: stay.location.lat,
      lng: stay.location.lng,
    });
  }
  return pins;
}
