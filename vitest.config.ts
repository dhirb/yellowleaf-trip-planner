import { defineConfig } from "vitest/config";

// Standalone config so the rules tests run in Node without pulling in the
// app's React/PWA Vite plugins. Tests talk to the Firestore emulator, which is
// provided by `firebase emulators:exec` (see the "test" npm script).
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    testTimeout: 10_000,
    hookTimeout: 30_000,
  },
});
