/**
 * City lookup through OpenStreetMap's Nominatim geocoder.
 *
 * Free, open data (ODbL), no API key. The public instance's usage policy rules
 * out search-as-you-type and asks for at most one request per second from an
 * identifiable client, so the admin field that uses this only searches on an
 * explicit "Find" (one request per lookup) and the browser's Referer
 * identifies the app. Results are only ever fetched in the admin editor and
 * stored on the trip — the traveler map never geocodes, so it works offline
 * and never touches the service.
 *
 * Like `imageSearch.ts`, a failed lookup is "no results", never a throw.
 */

import { isGeoPoint } from "./geo";

const ENDPOINT = "https://nominatim.openstreetmap.org/search";

/** Suggestions per query; a short list reads faster than a complete one. */
const RESULT_LIMIT = 6;

/** A place the admin can pin something to. */
export interface Place {
  /** The place's own name, e.g. "Ortisei" or "Deutsches Museum". */
  name: string;
  /** One-line disambiguation for the menu, e.g. "Ortisei, Trentino-Alto Adige, Italy". */
  label: string;
  country: string;
  lat: number;
  lng: number;
}

/**
 * What kind of result to ask for: `settlement` keeps to cities, towns and
 * villages (a stay's base); `any` also finds museums, parks and restaurants
 * (an activity).
 */
export type PlaceScope = "settlement" | "any";

/** The parts of a Nominatim `jsonv2` row we read. */
interface NominatimRow {
  lat?: string;
  lon?: string;
  name?: string;
  display_name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    country?: string;
  };
}

/** The search URL for a query. Exported so the shape is testable without fetch. */
export function placeSearchUrl(query: string, scope: PlaceScope): string {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    limit: String(RESULT_LIMIT),
    "accept-language": "en",
  });
  // Cities, towns and villages only — a street or a shop is not a "base".
  if (scope === "settlement") params.set("featureType", "settlement");
  return `${ENDPOINT}?${params}`;
}

function nameOf(row: NominatimRow): string {
  const a = row.address ?? {};
  const candidate =
    row.name?.trim() ||
    a.city?.trim() ||
    a.town?.trim() ||
    a.village?.trim() ||
    a.municipality?.trim() ||
    row.display_name?.split(",")[0]?.trim();
  return candidate ?? "";
}

function toPlace(row: NominatimRow): Place | null {
  const name = nameOf(row);
  if (!name) return null;
  const point = { lat: Number(row.lat), lng: Number(row.lon) };
  if (row.lat == null || row.lon == null || !isGeoPoint(point)) return null;

  const a = row.address ?? {};
  const locality = a.city?.trim() || a.town?.trim() || a.village?.trim();
  const state = a.state?.trim();
  const country = a.country?.trim() ?? "";
  // Name, then whichever of locality/state adds information, then country.
  const parts = [name];
  for (const part of [locality, state]) {
    if (part && !parts.includes(part)) parts.push(part);
  }
  if (country) parts.push(country);
  return { name, label: parts.join(", "), country, ...point };
}

/**
 * Turn a raw Nominatim payload into places, dropping anything malformed and
 * collapsing repeats of the same label (Nominatim often returns both the admin
 * boundary and the place node for a town).
 */
export function parsePlaces(raw: unknown): Place[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Place[] = [];
  for (const row of raw as NominatimRow[]) {
    const place = toPlace(row ?? {});
    if (!place) continue;
    const key = place.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(place);
  }
  return out;
}

/**
 * Search places matching `query`. Resolves to the matches ([] when there are
 * none) or null when the lookup itself failed — offline, a non-2xx response,
 * or an aborted request — so the field can tell "nothing found" from "could
 * not search".
 */
export async function searchPlaces(
  query: string,
  scope: PlaceScope,
  signal?: AbortSignal,
): Promise<Place[] | null> {
  const q = query.trim();
  if (!q) return [];
  try {
    const res = await fetch(placeSearchUrl(q, scope), {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return parsePlaces(await res.json());
  } catch {
    return null;
  }
}
