/**
 * Shared Firebase Admin SDK bootstrap for one-off provisioning/maintenance
 * scripts. Unlike the client SDK in `src/firebase.ts` (which uses the public
 * VITE_ web config), the Admin SDK runs with full privileges and bypasses
 * Firestore security rules, so it requires a real service-account credential.
 *
 * Set GOOGLE_APPLICATION_CREDENTIALS in your `.env` to the path of a service
 * account JSON key (Firebase console → Project settings → Service accounts →
 * Generate new private key). The project id is read from the key itself.
 */
import "dotenv/config";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function initAdminApp() {
  const existing = getApps();
  if (existing.length > 0) {
    return existing[0];
  }

  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialPath) {
    console.error(
      "Missing GOOGLE_APPLICATION_CREDENTIALS. Point it at your Firebase " +
        "service-account JSON key (see .env.example) before running this script.",
    );
    process.exit(1);
  }

  // `applicationDefault()` loads the JSON key named by GOOGLE_APPLICATION_CREDENTIALS
  // and infers the project id from it. We checked the var above to fail fast with
  // a friendly message rather than a deep SDK stack trace.
  return initializeApp({ credential: applicationDefault() });
}

const app = initAdminApp();

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
