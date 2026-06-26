/** Domain types for the Yellowleaf trip planner. */

export type ItemKind = "attraction" | "meal" | "stay" | "transport" | "other";
export type FlightKind = "arrival" | "departure";
export type ContactKind = "emergency" | "family" | "hotel" | "embassy" | "other";
export type Visibility = "public" | "private";
export type LayoutMode = "timeline" | "cards" | "list";

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
  localName?: string;
  desc?: string;
  address?: string;
  phone?: string;
  note?: string;
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
  /** Title in the destination's native language (optional). */
  local?: string;
  place?: string;
  tag?: string;
  note?: string;
  cost?: string;
  tip?: string;
  image?: string;
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
  nativeLang: Lang | null;
  currency: Currency;
  hotel: Stay;
  contacts: Contact[];
  phrases: Phrase[];
  days: Day[];
  /** Epoch millis; serverTimestamp is normalised to a number on read. */
  createdAt?: number;
  updatedAt?: number;
}

/** Shape stored in Firestore (everything except the doc id). */
export type TripData = Omit<Trip, "id">;
