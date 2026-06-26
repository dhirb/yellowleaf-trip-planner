import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // The Firestore SDK is a large but unavoidable vendor chunk; it is already
    // isolated and loaded per-route. Raise the limit so the build stays quiet.
    chunkSizeWarningLimit: 700,
  },
});
