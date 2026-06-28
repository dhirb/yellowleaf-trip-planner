import { useEffect, useState } from "react";
import type { Trip } from "../types";
import { subscribeOwnerTrips } from "../lib/trips";

interface TripsState {
  trips: Trip[];
  loading: boolean;
  error: string | null;
}

/** Live list of trips the user can manage: owned plus shared as a co-owner. */
export function useTrips(
  uid: string | undefined,
  email: string | null | undefined,
): TripsState {
  const [state, setState] = useState<TripsState>({
    trips: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!uid) {
      setState({ trips: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    const unsub = subscribeOwnerTrips(
      uid,
      email ?? null,
      (trips) => {
        const sorted = [...trips].sort(
          (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0),
        );
        setState({ trips: sorted, loading: false, error: null });
      },
      (err) => setState({ trips: [], loading: false, error: err.message }),
    );
    return unsub;
  }, [uid, email]);

  return state;
}
