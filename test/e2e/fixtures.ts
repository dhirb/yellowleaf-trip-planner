import { test as base, expect } from "@playwright/test";

/**
 * Shared e2e fixtures.
 *
 * App Check debug token: when `FIREBASE_APPCHECK_DEBUG_TOKEN` is set in the
 * environment, inject it into every browser context *before* any app module
 * runs. Firebase reads `self.FIREBASE_APPCHECK_DEBUG_TOKEN` inside
 * `initializeAppCheck()` (src/firebase.ts), so a token set via `addInitScript`
 * — which runs ahead of page scripts — lets an enforced Firebase backend accept
 * requests from the test browser instead of demanding a real reCAPTCHA solve.
 *
 * Register the token once under Firebase console → App Check → Manage debug
 * tokens, then expose it to CI as a secret. When the variable is unset (the
 * default), this is a no-op and tests run exactly as before.
 *
 * Note: the current font-scale harness mounts components with seed data and
 * never loads src/firebase.ts, so this only takes effect once an e2e test
 * exercises a Firebase-backed flow.
 */
const appCheckDebugToken = process.env.FIREBASE_APPCHECK_DEBUG_TOKEN;

export const test = base.extend({
  context: async ({ context }, use) => {
    if (appCheckDebugToken) {
      await context.addInitScript((token) => {
        (
          window as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string }
        ).FIREBASE_APPCHECK_DEBUG_TOKEN = token;
      }, appCheckDebugToken);
    }
    // `use` is Playwright's fixture-teardown callback, not a React hook.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(context);
  },
});

export { expect };
