import { useEffect, useState } from "react";
import { airportIndex, loadAirports, type AirportIndex } from "../lib/airports";

/**
 * The airport dataset, keyed by IATA code, for pinning flights on the day map.
 * Loads lazily once `enabled` turns true (a trip with flights) and stays null
 * until then, or when the fetch fails — the map simply shows no airport pins.
 */
export function useAirports(enabled: boolean): AirportIndex | null {
  const [index, setIndex] = useState<AirportIndex | null>(null);
  // Bumped when the browser comes back online, so a fetch that failed while
  // offline is tried again instead of leaving flights off the map all session.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || index) return;
    let cancelled = false;
    loadAirports()
      .then((airports) => {
        if (!cancelled) setIndex(airportIndex(airports));
      })
      .catch(() => {
        if (cancelled) return;
        const retry = () => setAttempt((n) => n + 1);
        window.addEventListener("online", retry, { once: true });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, index, attempt]);

  return index;
}
