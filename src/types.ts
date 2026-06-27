/** Domain types for the Yellowleaf trip planner. */

export type ItemKind = "attraction" | "meal" | "stay" | "transport" | "other";
export type FlightKind = "arrival" | "departure";
export type ContactKind =
  | "emergency"
  | "family"
  | "hotel"
  | "embassy"
  | "other";
export type Visibility = "public" | "private";

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
export type StayTranslation = Partial<Pick<Stay, "name" | "desc">>;
/** Per-language field overrides for a Day. */
export interface DayTranslation {
  theme?: string;
}

export interface Contact {
  label: string;
  value: string;
  kind: ContactKind;
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

export interface Flight {
  time: string;
  flightNo: string;
  from: string;
  to: string;
  kind: FlightKind;
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
  title: string;
  dest: string;
  country: string;
  /** Hex colour used for the trip's cover chip. */
  cover: string;
  visibility: Visibility;
  /** Access code for private trips (soft, client-side gate). */
  password: string;
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
