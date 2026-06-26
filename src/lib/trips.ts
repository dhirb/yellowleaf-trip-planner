import {
  addDoc,
  collection,
  deleteDoc,
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
import type { Trip, TripData } from "../types";
import { todayISO } from "./date";
import { pickCover } from "./ids";

const COLLECTION = "trips";

/** Convert a Firestore snapshot to a typed Trip, normalising timestamps to millis. */
function toTrip(snap: QueryDocumentSnapshot<DocumentData>): Trip {
  const data = snap.data();
  const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : undefined;
  const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : undefined;
  return { ...(data as TripData), id: snap.id, createdAt, updatedAt };
}

/** A fresh, empty trip owned by `ownerId`, starting today as a single draft day. */
export function blankTrip(ownerId: string): TripData {
  return {
    ownerId,
    title: "Untitled trip",
    dest: "New destination",
    country: "",
    cover: pickCover(Math.floor(Math.random() * 6)),
    visibility: "private",
    password: "",
    published: false,
    nativeLang: null,
    currency: { code: "USD", symbol: "$", home: "USD", homeSymbol: "$", perHome: 1 },
    hotel: { name: "", desc: "", address: "", phone: "" },
    contacts: [],
    phrases: [],
    days: [{ date: todayISO(), theme: "Day 1", weather: "", items: [], stay: null, flights: [] }],
  };
}

/** Create a new trip and return its id. */
export async function createTrip(ownerId: string): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...blankTrip(ownerId),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Persist the full trip document (overwrites, refreshing `updatedAt`). */
export async function saveTrip(id: string, data: TripData): Promise<void> {
  // Never let client-managed timestamp fields leak into the payload.
  const { createdAt: _c, updatedAt: _u, ...rest } = data as TripData & {
    createdAt?: number;
    updatedAt?: number;
  };
  void _c;
  void _u;
  await setDoc(
    doc(db, COLLECTION, id),
    { ...rest, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/** One-shot read of a single trip. */
export async function getTrip(id: string): Promise<Trip | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? toTrip(snap as QueryDocumentSnapshot<DocumentData>) : null;
}

/** Delete a trip. */
export async function deleteTrip(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

/** Live-subscribe to a single trip. Calls back with `null` when it is missing. */
export function subscribeTrip(id: string, cb: (trip: Trip | null) => void, onError: (e: Error) => void) {
  return onSnapshot(
    doc(db, COLLECTION, id),
    (snap) => cb(snap.exists() ? toTrip(snap as QueryDocumentSnapshot<DocumentData>) : null),
    (err) => onError(err),
  );
}

/** Live-subscribe to all trips owned by `uid`. */
export function subscribeOwnerTrips(uid: string, cb: (trips: Trip[]) => void, onError: (e: Error) => void) {
  const q = query(collection(db, COLLECTION), where("ownerId", "==", uid));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map(toTrip)),
    (err) => onError(err),
  );
}
