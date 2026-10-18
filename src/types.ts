/** Domain types for the Yellowleaf trip planner. */

export type ItemKind = "attraction" | "meal" | "stay" | "transport" | "other";
/** Legacy flight direction — kept only to migrate old single-time flights. */
export type FlightKind = "arrival" | "departure";
export type ContactKind =
  "emergency" | "family" | "hotel" | "embassy" | "other";

export interface Currency {
  code: string;
  symbol: string;
  /** Home currency code, e.g. "AUD". */
  home: string;
  /** Home currency symbol, e.g. "A$". */
  homeSymbol: string;
  /** How many units of the local currency equal one unit of home. */
  perHome: number;
}

export interface Lang {
  code: string;
  label: string;
}

/** Per-language field overrides for an Item (English is the base). */
export type ItemTranslation = Partial<
  Pick<Item, "title" | "note" | "place" | "tag" | "tip">
>;
/** Per-language field overrides for a Stay. */
export type StayTranslation = Partial<Pick<Stay, "name" | "desc" | "note">>;
/** Per-language field overrides for a Day. */
export interface DayTranslation {
  theme?: string;
}

export interface Contact {
  label: string;
  value: string;
  kind: ContactKind;
  /** Admin-chosen dot colour. Falls back to the kind's default when unset. */
  color?: string;
}

/** A WGS84 coordinate. Validated on read by `isGeoPoint` (lib/geo.ts). */
export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Phrase {
  en: string;
  local: string;
  pron: string;
}

/**
 * One booking, held at the trip level and resolved back to a day at read time
 * (see `lib/stays.ts`). The nights model: a stay covers `checkIn <= date <
 * checkOut`, so check in on the 3rd and out on the 6th means the nights of the
 * 3rd, 4th and 5th — the 6th shows no accommodation.
 */
export interface Stay {
  name: string;
  desc?: string;
  address?: string;
  phone?: string;
  note?: string;
  /**
   * The city or town this base is in, as shown on the traveler's map. Never
   * translated — place names stay recognisable across languages.
   */
  city?: string;
  /**
   * Where the map pin sits. Set only by picking a geocoder suggestion in the
   * admin stay editor (see `PlaceField`); a stay without one is left off the map.
   */
  location?: GeoPoint;
  /** ISO date, "YYYY-MM-DD". The first night. */
  checkIn: string;
  /** ISO date, "YYYY-MM-DD". The morning of departure — not a night here. */
  checkOut: string;
  /** Per-language overrides, keyed by Lang.code. */
  t?: Record<string, StayTranslation>;
}

/** A connecting stop between a flight's origin and destination. */
export interface Layover {
  /** Free text, e.g. "Hong Kong (HKG)". */
  airport: string;
  /** Free text, e.g. "2h 15m". */
  duration: string;
}

export interface Flight {
  flightNo: string;
  from: string;
  to: string;
  /** Departure time at the origin, "HH:MM". */
  depTime?: string;
  /** Arrival time at the destination, "HH:MM". */
  arrTime?: string;
  /** Optional connecting stops, in order from origin to destination. */
  layovers?: Layover[];
  /** Optional free-text detail (terminal, gate, baggage tips, etc.). */
  note?: string;
}

export interface Item {
  kind: ItemKind;
  time: string;
  title: string;
  place?: string;
  tag?: string;
  note?: string;
  cost?: string;
  tip?: string;
  image?: string;
  /**
   * Where this activity sits on the day's map. Set only by picking a geocoder
   * result in the admin item editor; without one the activity is left off.
   */
  location?: GeoPoint;
  /** Per-language overrides, keyed by Lang.code. */
  t?: Record<string, ItemTranslation>;
}

export interface Day {
  /** ISO date, "YYYY-MM-DD". */
  date: string;
  theme: string;
  weather: string;
  items: Item[];
  flights: Flight[];
  /** Optional per-day currency override (e.g. multi-country trips). */
  currency?: Currency;
  /** Per-language overrides, keyed by Lang.code. */
  t?: Record<string, DayTranslation>;
}

export interface Trip {
  id: string;
  ownerId: string;
  /**
   * Co-owners granted edit access, identified by their (lowercased) account
   * email. They may edit trip content but not manage this list or delete the
   * trip — only the original `ownerId` can. Matched in Firestore rules against
   * the signed-in user's `token.email`, so the person must already have an
   * account.
   */
  coOwnerEmails?: string[];
  title: string;
  dest: string;
  country: string;
  /** Hex colour used for the trip's cover chip. */
  cover: string;
  /**
   * Whether the trip is shared. A draft (`false`) is readable only by its
   * owner; once published (`true`) it is viewable by anyone who has the share
   * link — the unguessable link is the access boundary (a capability URL).
   */
  published: boolean;
  /** Added non-English languages. English is always the implicit base. */
  languages: Lang[];
  currency: Currency;
  /** Accommodation for the whole trip, each entry carrying its own dates. */
  stays: Stay[];
  contacts: Contact[];
  phrases: Phrase[];
  days: Day[];
  /** Epoch millis; serverTimestamp is normalised to a number on read. */
  createdAt?: number;
  updatedAt?: number;
  /** Epoch millis when soft-deleted. Absent/null means the trip is active. */
  deletedAt?: number | null;
}

/** Shape stored in Firestore (everything except the doc id). */
export type TripData = Omit<Trip, "id">;
