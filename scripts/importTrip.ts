/**
 * Import a hand-written trip (a `SeedTrip` literal under `src/data/`) into
 * Firestore as a new document owned by an admin account.
 *
 * Usage:
 *   npm run import:trip -- <path-to-data-module> [--owner user@example.com] [--update <docId>] [--dry-run]
 *
 *   npm run import:trip -- src/data/europeTrip2027/index.ts --dry-run
 *   npm run import:trip -- src/data/europeTrip2027/index.ts --owner me@example.com
 *   npm run import:trip -- src/data/europeTrip2027/index.ts --update vkvqiTZ57MnvDgrQeUUh
 *
 * The module may export the trip under any name; the first export that looks
 * like a trip (has `title` and a `days` array) is used. Without `--owner` the
 * script looks for exactly one Auth user carrying the `role: admin` custom claim
 * and uses that account, so a single-admin project needs no flag.
 *
 * `--update <docId>` overwrites an existing trip's content with the module's
 * (same shape as the editor's autosave: a merge that leaves `createdAt` alone
 * and refreshes `updatedAt`). The document must exist and not be soft-deleted.
 * Without `--owner` the existing document's owner is kept.
 *
 * The data passes through `normalizeTrip` first, so legacy seed shapes
 * (`hotel`, per-day `stay`, `local`) are stored in the current model, not
 * migrated on every read. `--dry-run` prints what would be written and exits.
 *
 * Runs with the Admin SDK, which bypasses Firestore rules — so this is the
 * only path that can create a trip outside the admin UI. Requires
 * GOOGLE_APPLICATION_CREDENTIALS (see .env.example and scripts/firebaseAdmin.ts).
 */
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { Auth } from "firebase-admin/auth";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { normalizeTrip, type RawTripData } from "../src/lib/migrateTrip";
import type { TripData } from "../src/types";

const TRIPS_COLLECTION = "trips";
const ADMIN_ROLE = "admin";
/** Admin SDK page size; one page is plenty for a hobby project's user list. */
const USER_PAGE_SIZE = 1000;

type SeedTrip = Omit<RawTripData, "ownerId">;

interface Args {
  modulePath: string;
  ownerEmail: string | null;
  /** Existing trip document id to overwrite, or null to create a new one. */
  updateId: string | null;
  isDryRun: boolean;
}

function parseArgs(argv: readonly string[]): Args {
  let modulePath: string | null = null;
  let ownerEmail: string | null = null;
  let updateId: string | null = null;
  let isDryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      isDryRun = true;
    } else if (arg === "--owner") {
      ownerEmail = argv[++i] ?? null;
      if (!ownerEmail) fail("--owner needs an email address.");
    } else if (arg === "--update") {
      updateId = argv[++i] ?? null;
      if (!updateId) fail("--update needs a trip document id.");
    } else if (arg.startsWith("--")) {
      fail(`Unknown flag "${arg}".`);
    } else if (modulePath) {
      fail(`Unexpected extra argument "${arg}".`);
    } else {
      modulePath = arg;
    }
  }

  if (!modulePath) {
    fail(
      "Missing data module.\n\n  Usage: npm run import:trip -- <path-to-data-module> [--owner email] [--update docId] [--dry-run]",
    );
  }
  return { modulePath, ownerEmail, updateId, isDryRun };
}

function isSeedTrip(value: unknown): value is SeedTrip {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as SeedTrip).title === "string" &&
    Array.isArray((value as SeedTrip).days)
  );
}

/** Load the module and pick the first export that is shaped like a trip. */
async function loadSeedTrip(modulePath: string): Promise<SeedTrip> {
  const url = pathToFileURL(resolve(modulePath)).href;
  const mod: Record<string, unknown> = await import(url);
  const trips = Object.entries(mod).filter(([, v]) => isSeedTrip(v));
  if (trips.length === 0) {
    fail(
      `${modulePath} exports nothing that looks like a trip (title + days).`,
    );
  }
  if (trips.length > 1) {
    fail(
      `${modulePath} exports several trips (${trips.map(([k]) => k).join(", ")}); export exactly one.`,
    );
  }
  return trips[0][1] as SeedTrip;
}

/** Resolve the owner: by email when given, else the sole admin-claimed account. */
async function resolveOwner(
  auth: Auth,
  email: string | null,
): Promise<{ uid: string; email: string }> {
  if (email) {
    const user = await auth.getUserByEmail(email);
    return { uid: user.uid, email };
  }

  const { users } = await auth.listUsers(USER_PAGE_SIZE);
  const admins = users.filter((u) => u.customClaims?.role === ADMIN_ROLE);
  if (admins.length === 1 && admins[0].email) {
    return { uid: admins[0].uid, email: admins[0].email };
  }
  if (admins.length === 0) {
    fail(
      "No admin account found. Provision one first: npm run provision -- you@example.com",
    );
  }
  fail(
    `Several admins found — pick one with --owner:\n${admins.map((a) => `  ${a.email ?? a.uid}`).join("\n")}`,
  );
}

/**
 * Firestore rejects `undefined` field values; a JSON round-trip drops them
 * (and any stray functions) without touching the rest of the document.
 */
function stripUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function summarize(
  trip: TripData,
  owner: { uid: string; email: string },
): string {
  const first = trip.days[0]?.date ?? "—";
  const last = trip.days[trip.days.length - 1]?.date ?? "—";
  const itemCount = trip.days.reduce((n, d) => n + d.items.length, 0);
  const flightCount = trip.days.reduce((n, d) => n + d.flights.length, 0);
  return [
    `  title:    ${trip.title}`,
    `  dest:     ${trip.dest}`,
    `  owner:    ${owner.email} (${owner.uid})`,
    `  dates:    ${first} → ${last} (${trip.days.length} days)`,
    `  stays:    ${trip.stays.length}`,
    ...trip.stays.map(
      (s) => `            ${s.checkIn} → ${s.checkOut}  ${s.name}`,
    ),
    `  items:    ${itemCount}   flights: ${flightCount}`,
    `  langs:    en${trip.languages.map((l) => `, ${l.code}`).join("")}`,
    `  status:   ${trip.published ? "published" : "draft"}`,
  ].join("\n");
}

async function createTrip(db: Firestore, trip: TripData): Promise<string> {
  const ref = await db.collection(TRIPS_COLLECTION).add({
    ...stripUndefined(trip),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

/**
 * The existing document's owner uid, so `--update` without `--owner` keeps the
 * trip where it is. Refuses to touch a missing or soft-deleted trip — the UI
 * treats those as gone, and reviving one by overwrite would be a surprise.
 */
async function existingOwnerId(db: Firestore, id: string): Promise<string> {
  const snap = await db.collection(TRIPS_COLLECTION).doc(id).get();
  if (!snap.exists) fail(`${TRIPS_COLLECTION}/${id} does not exist.`);
  const data = snap.data() ?? {};
  if (data.deletedAt) fail(`${TRIPS_COLLECTION}/${id} is soft-deleted.`);
  if (typeof data.ownerId !== "string" || !data.ownerId) {
    fail(`${TRIPS_COLLECTION}/${id} has no ownerId; pass --owner.`);
  }
  return data.ownerId;
}

/** Overwrite content in place; mirrors `saveTrip` in src/lib/trips.ts. */
async function updateTrip(
  db: Firestore,
  id: string,
  trip: TripData,
): Promise<void> {
  await db
    .collection(TRIPS_COLLECTION)
    .doc(id)
    .set(
      { ...stripUndefined(trip), updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
}

async function main(): Promise<void> {
  const { modulePath, ownerEmail, updateId, isDryRun } = parseArgs(
    process.argv.slice(2),
  );
  const seed = await loadSeedTrip(modulePath);

  // Only touch the Admin SDK once the data has loaded, so a typo in the module
  // path fails fast without needing credentials configured.
  const { adminAuth, adminDb } = await import("./firebaseAdmin");
  const owner =
    updateId && !ownerEmail
      ? await ownerByUid(adminAuth, await existingOwnerId(adminDb, updateId))
      : await resolveOwner(adminAuth, ownerEmail);
  const trip = normalizeTrip({ ...seed, ownerId: owner.uid });

  const verb = updateId
    ? `${isDryRun ? "Would update" : "Updating"} ${TRIPS_COLLECTION}/${updateId}`
    : isDryRun
      ? "Would import"
      : "Importing";
  console.log(`\n${verb}:\n${summarize(trip, owner)}\n`);
  if (isDryRun) {
    console.log("Dry run — nothing written.\n");
    process.exit(0);
  }

  if (updateId) {
    await updateTrip(adminDb, updateId, trip);
    console.log(`✓ Updated → ${TRIPS_COLLECTION}/${updateId}\n`);
  } else {
    const id = await createTrip(adminDb, trip);
    console.log(
      `✓ Imported → ${TRIPS_COLLECTION}/${id}\n  Open /admin and it is in your trips list.\n`,
    );
  }
  process.exit(0);
}

async function ownerByUid(
  auth: Auth,
  uid: string,
): Promise<{ uid: string; email: string }> {
  const user = await auth.getUser(uid);
  return { uid, email: user.email ?? "(no email)" };
}

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  fail(`Import failed: ${message}`);
});
