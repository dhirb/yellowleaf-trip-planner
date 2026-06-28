/** Domain types for the Yellowleaf trip planner. */

export type ItemKind = "attraction" | "meal" | "stay" | "transport" | "other";
/** Legacy flight direction — kept only to migrate old single-time flights. */
export type FlightKind = "arrival" | "departure";
export type ContactKind =
  | "emergency"
  | "family"
  | "hotel"
  | "embassy"
  | "other";

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

export interface Phrase {
  en: string;
  local: string;
  pron: string;
}

export interface Stay {
  name: string;
  desc?: string;
  address?: string;
  phone?: string;
  note?: string;
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
  /** Per-language overrides, keyed by Lang.code. */
  t?: Record<string, ItemTranslation>;
}

export interface Day {
  /** ISO date, "YYYY-MM-DD". */
  date: string;
  theme: string;
  weather: string;
  items: Item[];
  stay: Stay | null;
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
  hotel: Stay;
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
