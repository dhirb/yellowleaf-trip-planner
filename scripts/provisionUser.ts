/**
 * Provision an authorized user from an email address.
 *
 * Creates (or reuses) a Firebase Auth account, tags it with a role via a custom
 * claim, records it in the Firestore `users` collection, and prints a
 * set-password link the new user follows to choose their own password.
 *
 * Usage:
 *   npm run provision -- user@example.com [role]
 *
 * `role` defaults to "admin" — currently the only supported type. To add more
 * user types later, extend USER_TYPES below; everything else flows from it.
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS (a service-account key) — see
 * .env.example and scripts/firebaseAdmin.ts.
 */
import type { Auth } from "firebase-admin/auth";
import { FieldValue, type Firestore } from "firebase-admin/firestore";

/** Single source of truth for the roles this script may grant. */
const USER_TYPES = ["admin"] as const;
type UserType = (typeof USER_TYPES)[number];
const DEFAULT_ROLE: UserType = "admin";

const USERS_COLLECTION = "users";

/** Conservative email shape check — the real validation is Firebase itself. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Args {
  email: string;
  role: UserType;
}

function parseArgs(argv: readonly string[]): Args {
  const [email, roleArg] = argv;

  if (!email || !EMAIL_PATTERN.test(email)) {
    fail(
      `Invalid or missing email.\n\n  Usage: npm run provision -- user@example.com [${USER_TYPES.join(" | ")}]`,
    );
  }

  const role = roleArg ?? DEFAULT_ROLE;
  if (!isUserType(role)) {
    fail(`Unknown role "${role}". Supported roles: ${USER_TYPES.join(", ")}.`);
  }

  return { email, role };
}

function isUserType(value: string): value is UserType {
  return (USER_TYPES as readonly string[]).includes(value);
}

/** Look up an existing Auth user by email, creating one (no password) if absent. */
async function resolveUser(
  auth: Auth,
  email: string,
): Promise<{ uid: string; created: boolean }> {
  try {
    const existing = await auth.getUserByEmail(email);
    return { uid: existing.uid, created: false };
  } catch (error: unknown) {
    if (isAuthError(error, "auth/user-not-found")) {
      const user = await auth.createUser({ email });
      return { uid: user.uid, created: true };
    }
    throw error;
  }
}

async function writeUserDoc(
  db: Firestore,
  uid: string,
  email: string,
  role: UserType,
  created: boolean,
): Promise<void> {
  const doc: Record<string, unknown> = {
    email,
    role,
    disabled: false,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (created) {
    doc.createdAt = FieldValue.serverTimestamp();
  }
  await db.collection(USERS_COLLECTION).doc(uid).set(doc, { merge: true });
}

async function main(): Promise<void> {
  // Validate args before importing the Admin SDK, so bad input fails fast
  // without requiring service-account credentials to be configured.
  const { email, role } = parseArgs(process.argv.slice(2));
  const { adminAuth, adminDb } = await import("./firebaseAdmin");

  const { uid, created } = await resolveUser(adminAuth, email);
  await adminAuth.setCustomUserClaims(uid, { role });
  await writeUserDoc(adminDb, uid, email, role, created);
  const resetLink = await adminAuth.generatePasswordResetLink(email);

  console.log(
    [
      `\n✓ Provisioned ${role} user`,
      `  email: ${email}`,
      `  uid:   ${uid} ${created ? "(created)" : "(existing)"}`,
      `  claim: { role: "${role}" }`,
      `  doc:   ${USERS_COLLECTION}/${uid}`,
      "",
      "  Share this set-password link with the user:",
      `  ${resetLink}`,
      "",
    ].join("\n"),
  );
  process.exit(0);
}

function isAuthError(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === code
  );
}

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  fail(`Provisioning failed: ${message}`);
});
