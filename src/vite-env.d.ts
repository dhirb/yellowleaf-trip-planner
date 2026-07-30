/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  // reCAPTCHA v3 site key for Firebase App Check. Optional locally (App Check is
  // then skipped, see src/firebase.ts); a production build without it fails in
  // vite.config.ts, since AI Logic requires App Check from 2026-11-02.
  readonly VITE_FIREBASE_APPCHECK_SITE_KEY?: string;
  // Optional, dev only: a debug token registered under Firebase console → App
  // Check → Manage debug tokens, so localhost keeps the same attested identity
  // across reloads instead of minting a throwaway token each time.
  readonly VITE_FIREBASE_APPCHECK_DEBUG_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
