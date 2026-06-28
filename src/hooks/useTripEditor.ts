import { useCallback, useEffect, useRef, useState } from "react";
import type { Trip, TripData } from "../types";
import { saveTrip, subscribeTrip } from "../lib/trips";

const SAVE_DEBOUNCE_MS = 600;

function toData(trip: Trip): TripData {
  const { id: _id, ...data } = trip;
  void _id;
  return data;
}

export interface TripEditor {
  trip: Trip | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  /** Apply an immutable change; autosaves after a short debounce. */
  update: (updater: (t: Trip) => Trip) => void;
  /** Replace the working trip wholesale (e.g. after a date-range edit). */
  set: (next: Trip) => void;
  /** Persist immediately and return when done (used by Publish). */
  publish: () => Promise<void>;
}

/**
 * Subscribes to a trip live for editing, then persists changes to Firestore on
 * a debounce. The snapshot listener keeps the editor current with writes from
 * elsewhere (other tabs/devices, the traveler view), but remote updates are
 * applied only when the working copy is clean — never while the admin has
 * pending edits or a save in flight — so in-progress edits are never clobbered
 * by snapshot echoes.
 */
export function useTripEditor(id: string): TripEditor {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = useRef(false);
  const savingRef = useRef(false);
  const loaded = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLoading(true);
    dirty.current = false;
    loaded.current = false;
    const unsub = subscribeTrip(
      id,
      (remote) => {
        // First snapshot always populates the editor (instant display).
        if (!loaded.current) {
          loaded.current = true;
          setTrip(remote);
          setLoading(false);
          return;
        }
        // Afterwards, only adopt remote data when there is nothing local to
        // protect — otherwise the admin's unsaved edits would be overwritten.
        if (dirty.current || savingRef.current) return;
        setTrip(remote);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [id]);

  // Debounced autosave whenever the working copy changes via update/set.
  useEffect(() => {
    if (!trip || !dirty.current) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      dirty.current = false;
      savingRef.current = true;
      setSaving(true);
      try {
        await saveTrip(id, toData(trip));
        setError(null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to save changes.");
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer.current);
  }, [trip, id]);

  const update = useCallback((updater: (t: Trip) => Trip) => {
    setTrip((prev) => (prev ? updater(prev) : prev));
    dirty.current = true;
  }, []);

  const set = useCallback((next: Trip) => {
    setTrip(next);
    dirty.current = true;
  }, []);

  const publish = useCallback(async () => {
    setTrip((prev) => (prev ? { ...prev, published: true } : prev));
    // Read the freshest value via a microtask-safe functional flush.
    savingRef.current = true;
    setSaving(true);
    dirty.current = false;
    clearTimeout(timer.current);
    try {
      const current = await new Promise<Trip | null>((resolve) => {
        setTrip((prev) => {
          resolve(prev);
          return prev;
        });
      });
      if (current) await saveTrip(id, toData({ ...current, published: true }));
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to publish.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [id]);

  return { trip, loading, saving, error, update, set, publish };
}
