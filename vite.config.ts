import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

/**
 * Refuse to build a bundle that cannot attest itself.
 *
 * Firebase enforces App Check on every AI Logic (Gemini) request from
 * 2026-11-02, and that enforcement cannot be turned off again. Without the
 * reCAPTCHA site key `src/firebase.ts` skips `initializeAppCheck()` entirely —
 * fine for `npm run dev`, but a deployed build would have the "Ask AI" and
 * "Translate with AI" assists permanently rejected with no signal at build or
 * deploy time. Failing here makes that impossible to ship by accident.
 *
 * Escape hatch for a deliberate local build without App Check:
 *   ALLOW_UNATTESTED_BUILD=1 npm run build
 */
function assertAppCheckConfigured(mode: string) {
  // `loadEnv` reads the .env files for this mode and also picks up prefixed vars
  // already on process.env — how CI supplies them (.github/workflows/deploy.yml).
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const siteKey =
    env.VITE_FIREBASE_APPCHECK_SITE_KEY ||
    process.env.VITE_FIREBASE_APPCHECK_SITE_KEY;

  if (siteKey || process.env.ALLOW_UNATTESTED_BUILD) return;

  throw new Error(
    "VITE_FIREBASE_APPCHECK_SITE_KEY is not set, so this build would ship without " +
      "Firebase App Check. AI Logic requires App Check from 2026-11-02, so the AI " +
      "assists would be permanently rejected. Set the key in .env (or as the " +
      "GitHub Actions repo variable), or pass ALLOW_UNATTESTED_BUILD=1 to build " +
      "without App Check on purpose.",
  );
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === "build") assertAppCheckConfigured(mode);

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        // We register the service worker programmatically from main.tsx via the
        // `virtual:pwa-register` module, which keeps us CSP-safe (no inline script).
        injectRegister: null,
        includeAssets: ["favicon.svg", "icons/apple-touch-icon.png"],
        manifest: {
          name: "Yellowleaf · Trip Planner",
          short_name: "Yellowleaf",
          description:
            "A calm, large-type travel itinerary you can share with the people you love.",
          id: "/",
          start_url: "/",
          scope: "/",
          display: "standalone",
          orientation: "portrait",
          theme_color: "#C2541F",
          background_color: "#E5DDCF",
          categories: ["travel", "lifestyle"],
          icons: [
            {
              src: "icons/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "icons/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "icons/maskable-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
          navigateFallback: "/index.html",
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
              handler: "StaleWhileRevalidate",
              options: { cacheName: "google-fonts-stylesheets" },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-webfonts",
                expiration: {
                  maxEntries: 12,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // Activity thumbnails come from Wikimedia (see src/lib/imageSearch.ts).
              // The URLs are content-addressed and never change, so cache-first lets
              // a thumbnail render offline once it has been fetched online at least
              // once. Status 0 allows opaque cross-origin image responses to cache.
              urlPattern: /^https:\/\/upload\.wikimedia\.org\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "wikimedia-images",
                expiration: {
                  maxEntries: 120,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
    build: {
      // The Firestore SDK is a large but unavoidable vendor chunk; it is already
      // isolated and loaded per-route. Raise the limit so the build stays quiet.
      chunkSizeWarningLimit: 700,
    },
  };
});
