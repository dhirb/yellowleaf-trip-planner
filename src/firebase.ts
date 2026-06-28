import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

/**
 * Firebase configuration is read from Vite env vars (`VITE_FIREBASE_*`).
 * Copy `.env.example` to `.env` and fill in the values from your Firebase
 * console (Project settings → General → Your apps → SDK setup and configuration).
 */
const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** Validate at startup so a missing key fails fast with a clear message. */
const missing = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  // eslint-disable-next-line no-console
  console.error(
    `[firebase] Missing config: ${missing.join(", ")}. ` +
      "Did you copy .env.example to .env and fill in your Firebase project values?",
  );
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

/**
 * Persist Firestore data in IndexedDB so trips stay readable offline: once a
 * trip has been opened online, `onSnapshot` serves it straight from the local
 * cache when the network is down. The traveler view (a shareable PWA) relies on
 * this to keep working in flight mode, tunnels, or anywhere with no signal.
 *
 * Persistence needs IndexedDB. Where it is unavailable (Node test runs, private
 * browsing in some engines) we fall back to the default in-memory cache so the
 * app still loads instead of throwing at startup. The multi-tab manager keeps a
 * single shared cache consistent across the admin app's tabs.
 */
const localCache =
  typeof indexedDB !== "undefined"
    ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    : undefined;

export const db = initializeFirestore(app, localCache ? { localCache } : {});

// Firebase AI Logic is created lazily in src/lib/ai.ts via a dynamic import,
// so its (sizeable) code stays out of the initial bundle until "Ask AI" runs.
