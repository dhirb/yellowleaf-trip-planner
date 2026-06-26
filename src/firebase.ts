import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
export const db = getFirestore(app);

// Firebase AI Logic is created lazily in src/lib/ai.ts via a dynamic import,
// so its (sizeable) code stays out of the initial bundle until "Ask AI" runs.
