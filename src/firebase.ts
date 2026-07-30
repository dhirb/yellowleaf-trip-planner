import { initializeApp, type FirebaseOptions } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
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

/**
 * App Check attests that requests come from our genuine app before Firestore,
 * Auth, and AI Logic will serve them — the protection that matters once the web
 * config is public (it necessarily ships in the client bundle). The reCAPTCHA
 * v3 site key is itself a public value, like the rest of the Firebase config.
 *
 * It runs only in a real browser: reCAPTCHA needs `document` and a network, so
 * we skip it under Vitest/Node (the rules tests) to avoid init failures. A
 * missing site key no longer ships: `vite.config.ts` fails a production build
 * without one, because Firebase enforces App Check on every AI Logic request
 * from 2026-11-02 and an unattested bundle would have AI permanently broken.
 * Locally the key stays optional so the app still runs without App Check.
 *
 * In dev we use a debug token rather than solving reCAPTCHA. Set
 * `VITE_FIREBASE_APPCHECK_DEBUG_TOKEN` to the token registered under Firebase
 * console → App Check → Manage debug tokens so the same token survives every
 * reload; without it Firebase mints a throwaway one you must register by hand
 * each session.
 */
const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY;

if (typeof document !== "undefined" && appCheckSiteKey) {
  if (import.meta.env.DEV) {
    const debug = globalThis as typeof globalThis & {
      FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
    };
    // Prefer our registered token, falling back to `true` (Firebase mints a
    // throwaway one and logs it) when none is configured. `??=` never clobbers a
    // token already injected by the e2e harness: Playwright sets a *registered*
    // token via addInitScript (see test/e2e/fixtures.ts) so enforced backends
    // accept its requests. This whole branch is dead code in a production build,
    // so the token can never reach a shipped bundle.
    debug.FIREBASE_APPCHECK_DEBUG_TOKEN ??=
      import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN || true;
  }

  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

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
