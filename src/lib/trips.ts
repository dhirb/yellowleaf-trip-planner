import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { normalizeTrip, type RawTripData } from "./migrateTrip";
import type { Trip, TripData } from "../types";
import { todayISO } from "./date";
import { pickCover } from "./ids";

const COLLECTION = "trips";

/** Convert a Firestore snapshot to a typed Trip, normalising timestamps to millis. */
function toTrip(snap: QueryDocumentSnapshot<DocumentData>): Trip {
  const data = snap.data();
  const createdAt =
    data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : undefined;
  const updatedAt =
    data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : undefined;
  const deletedAt =
    data.deletedAt instanceof Timestamp ? data.deletedAt.toMillis() : null;
  const base = normalizeTrip(data as RawTripData);
  return {
    ...base,
    id: snap.id,
    createdAt,
    updatedAt,
    deletedAt,
  };
}

/** A fresh, empty trip owned by `ownerId`, starting today as a single draft day. */
export function blankTrip(ownerId: string): TripData {
  return {
    ownerId,
    title: "Untitled trip",
    dest: "New destination",
    country: "",
    cover: pickCover(Math.floor(Math.random() * 6)),
    published: false,
    coOwnerEmails: [],
    languages: [],
    currency: {
      code: "USD",
      symbol: "$",
      home: "USD",
      homeSymbol: "$",
      perHome: 1,
    },
    hotel: { name: "", desc: "", address: "", phone: "" },
    contacts: [],
    phrases: [],
    days: [
      {
        date: todayISO(),
        theme: "Day 1",
        weather: "",
        items: [],
        stay: null,
        flights: [],
      },
    ],
  };
}

/**
 * Begin creating a new trip. The document id is generated client-side, so it is
 * available synchronously — the caller can navigate to the editor immediately
 * while `created` (the Firestore write) settles in the background.
 */
export function newTripRef(ownerId: string): {
  id: string;
  created: Promise<void>;
} {
  const ref = doc(collection(db, COLLECTION));
  const created = setDoc(ref, {
    ...blankTrip(ownerId),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id, created };
}

/** Persist the full trip document (overwrites, refreshing `updatedAt`). */
export async function saveTrip(id: string, data: TripData): Promise<void> {
  // Never let server-managed timestamp fields (or the soft-delete marker) leak
  // into the payload; those are owned by createTrip/softDeleteTrip only.
  const {
    createdAt: _c,
    updatedAt: _u,
    deletedAt: _d,
    ...rest
  } = data as TripData & {
    createdAt?: number;
    updatedAt?: number;
    deletedAt?: number | null;
  };
  void _c;
  void _u;
  void _d;
  await setDoc(
    doc(db, COLLECTION, id),
    { ...rest, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/** One-shot read of a single trip. Soft-deleted trips read as missing. */
export async function getTrip(id: string): Promise<Trip | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  const trip = toTrip(snap as QueryDocumentSnapshot<DocumentData>);
  return trip.deletedAt ? null : trip;
}

/**
 * Soft-delete a trip: mark it deleted without removing the document. The trip
 * then reads as missing everywhere (list, traveler view) and Firestore rules
 * block all hard deletes, so this is the only way to "delete" a trip.
 */
export async function softDeleteTrip(id: string): Promise<void> {
  await setDoc(
    doc(db, COLLECTION, id),
    { deletedAt: serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/** Live-subscribe to a single trip. Calls back with `null` when it is missing. */
export function subscribeTrip(
  id: string,
  cb: (trip: Trip | null) => void,
  onError: (e: Error) => void,
) {
  return onSnapshot(
    doc(db, COLLECTION, id),
    (snap) => {
      if (!snap.exists()) return cb(null);
      const trip = toTrip(snap as QueryDocumentSnapshot<DocumentData>);
      cb(trip.deletedAt ? null : trip);
    },
    (err) => onError(err),
  );
}

/**
 * Live-subscribe to every trip the user can manage: those they own (`ownerId ==
 * uid`) plus those shared with them as a co-owner (`coOwnerEmails` contains their
 * email). Runs the two queries in parallel, dedupes by id, drops soft-deleted,
 * and emits the union.
 *
 * The two queries are fault-isolated: the owned query is primary, so its failure
 * is fatal (reported via `onError`). The co-owned query is best-effort — if it
 * fails (e.g. rules not yet deployed, or a transient error) we log and fall back
 * to showing owned trips, so a co-ownership hiccup can never hide trips you own.
 */
export function subscribeOwnerTrips(
  uid: string,
  email: string | null,
  cb: (trips: Trip[]) => void,
  onError: (e: Error) => void,
) {
  const ownedQ = query(collection(db, COLLECTION), where("ownerId", "==", uid));
  const sharedQ = email
    ? query(
        collection(db, COLLECTION),
        where("coOwnerEmails", "array-contains", email),
      )
    : null;

  let owned: Trip[] = [];
  let shared: Trip[] = [];
  let ownedReady = false;

  // Emit as soon as owned trips are ready; co-owned trips merge in when they
  // arrive. Never gate the owned list on the co-owned query.
  const emit = () => {
    if (!ownedReady) return;
    const byId = new Map<string, Trip>();
    for (const t of [...owned, ...shared]) {
      if (!t.deletedAt) byId.set(t.id, t);
    }
    cb([...byId.values()]);
  };

  const unsubOwned = onSnapshot(
    ownedQ,
    (snap) => {
      owned = snap.docs.map(toTrip);
      ownedReady = true;
      emit();
    },
    (err) => onError(err),
  );
  const unsubShared = sharedQ
    ? onSnapshot(
        sharedQ,
        (snap) => {
          shared = snap.docs.map(toTrip);
          emit();
        },
        (err) => {
          // Degrade gracefully: keep showing owned trips without co-owned ones.
          console.warn("Co-owned trips unavailable:", err.message);
          shared = [];
          emit();
        },
      )
    : null;

  return () => {
    unsubOwned();
    unsubShared?.();
  };
}
