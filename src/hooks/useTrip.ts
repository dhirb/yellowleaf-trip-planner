import { useEffect, useState } from "react";
import type { Trip } from "../types";
import { subscribeTrip } from "../lib/trips";

interface TripState {
  trip: Trip | null;
  loading: boolean;
  error: string | null;
}

/** Live single-trip subscription (read-only — used by the traveler view). */
export function useTrip(id: string | undefined): TripState {
  const [state, setState] = useState<TripState>({
    trip: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!id) {
      setState({ trip: null, loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    const unsub = subscribeTrip(
      id,
      (trip) => setState({ trip, loading: false, error: null }),
      (err) => setState({ trip: null, loading: false, error: err.message }),
    );
    return unsub;
  }, [id]);

  return state;
}
