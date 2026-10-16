import type { Contact, Phrase } from "../../types";
import type { RawTripData } from "../../lib/migrateTrip";
import { stays } from "./stays";
import { daysMunich } from "./daysMunich";
import { daysDolomites } from "./daysDolomites";
import { daysSlovenia } from "./daysSlovenia";
import { daysAlps } from "./daysAlps";
import { daysSalzburg } from "./daysSalzburg";
import { withImages } from "./images";
import { sortedByTime } from "./order";
import { ZH_HANS } from "./zh";

/**
 * "Bavaria · Dolomites · Slovenia · Austrian Alps · Salzburg", 31 Aug to 19 Sep
 * 2027, transcribed from the planning doc (europe-trip-2027-plan.md) into the
 * app's Trip shape.
 *
 * Data only. `scripts/importTrip.ts` attaches an ownerId and writes it to
 * Firestore. Unlike the older seeds this is already in the current model
 * (trip-level dated `stays`, per-language `t` overrides, no `local`/`hotel`),
 * so `normalizeTrip` is a no-op.
 *
 * Trip: 2 grandparents (limited mobility) + 2 adults + a 3-year-old. 17 nights,
 * 5 bases, rental car from day 4. Ljubljana on Marriott points, the rest cash.
 * English base with Simplified Chinese overrides on every translatable field,
 * for the grandparents.
 */
export type SeedTrip = Omit<RawTripData, "ownerId">;

const contacts: Contact[] = [
  { label: "Emergency (EU-wide)", value: "112", kind: "emergency" },
  { label: "Moxy Munich Messe", value: "TBC", kind: "hotel" },
  { label: "Ortisei apartment host", value: "TBC", kind: "hotel" },
  { label: "Four Points Ljubljana Mons", value: "TBC", kind: "hotel" },
  { label: "Zell am See apartment host", value: "TBC", kind: "hotel" },
  { label: "JUFA Hotel Salzburg City", value: "TBC", kind: "hotel" },
  { label: "Rental car roadside assistance", value: "TBC", kind: "other" },
];

const phrases: Phrase[] = [
  { en: "Hello (German)", local: "Hallo", pron: "HAH-lo" },
  { en: "Thank you (German)", local: "Danke", pron: "DAHN-kuh" },
  {
    en: "Where is the toilet? (German)",
    local: "Wo ist die Toilette?",
    pron: "vo ist dee toy-LET-uh",
  },
  { en: "Hello (Italian)", local: "Buongiorno", pron: "bwon-JOR-no" },
  { en: "Thank you (Italian)", local: "Grazie", pron: "GRAH-tsee-eh" },
  {
    en: "Where is the toilet? (Italian)",
    local: "Dov'è il bagno?",
    pron: "doh-VEH eel BAHN-yo",
  },
  { en: "Hello (Slovenian)", local: "Dober dan", pron: "DOH-ber dahn" },
  { en: "Thank you (Slovenian)", local: "Hvala", pron: "HVAH-la" },
  {
    en: "Where is the toilet? (Slovenian)",
    local: "Kje je stranišče?",
    pron: "kyeh yeh strah-NEESH-cheh",
  },
];

export const europeTrip2027: SeedTrip = {
  title: "Alps & Slovenia 2027",
  dest: "Munich · Dolomites · Ljubljana · Zell am See · Salzburg",
  country: "Germany · Italy · Slovenia · Austria",
  cover: "#2F7D5B",
  // Draft until the bookings firm up; publish from the admin Settings tab.
  published: false,
  coOwnerEmails: [],
  languages: [ZH_HANS],
  // Euros throughout, against a New Zealand dollar home. Plan rate €1 = NZD 2.00,
  // so 1 NZD ≈ €0.50.
  currency: {
    code: "EUR",
    symbol: "€",
    home: "NZD",
    homeSymbol: "NZ$",
    perHome: 0.5,
  },
  stays,
  contacts,
  phrases,
  days: sortedByTime(
    withImages([
      ...daysMunich,
      ...daysDolomites,
      ...daysSlovenia,
      ...daysAlps,
      ...daysSalzburg,
    ]),
  ),
};
