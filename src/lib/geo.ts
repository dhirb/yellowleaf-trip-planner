/**
 * Coordinate helpers shared by the geocoder, the trip migration and the map.
 * Kept framework-free so they can be unit-tested in node.
 */

import type { GeoPoint } from "../types";

const MAX_LAT = 90;
const MAX_LNG = 180;

/**
 * True for a finite WGS84 coordinate within range. Used at the system
 * boundaries — geocoder responses and stored Firestore docs — so the map only
 * ever receives points Leaflet can place.
 */
export function isGeoPoint(value: unknown): value is GeoPoint {
  if (typeof value !== "object" || value === null) return false;
  const { lat, lng } = value as Record<string, unknown>;
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= MAX_LAT &&
    Math.abs(lng) <= MAX_LNG
  );
}
