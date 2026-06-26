/**
 * OPTIONAL one-off seeder for the three demo trips. Not part of normal setup.
 *
 * Usage:
 *   1. Fill in .env (the VITE_FIREBASE_* values).
 *   2. Create an admin account in the app (or Firebase console), then set:
 *        SEED_EMAIL=you@example.com
 *        SEED_PASSWORD=your-password
 *      either in .env or inline on the command line.
 *   3. Run:  npm run seed
 *
 * The trips are created owned by that account, so Firestore rules permit them.
 */
import "dotenv/config";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { addDoc, collection, getFirestore, serverTimestamp } from "firebase/firestore";
import { seedTrips } from "../src/data/seedTrips";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

async function main(): Promise<void> {
  const config = {
    apiKey: required("VITE_FIREBASE_API_KEY"),
    authDomain: required("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: required("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  };
  const email = required("SEED_EMAIL");
  const password = required("SEED_PASSWORD");

  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const cred = await signInWithEmailAndPassword(auth, email, password);
  const ownerId = cred.user.uid;
  console.log(`Signed in as ${email} (${ownerId}). Seeding ${seedTrips.length} trips…`);

  for (const trip of seedTrips) {
    const ref = await addDoc(collection(db, "trips"), {
      ...trip,
      ownerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`  ✓ ${trip.title} → ${ref.id}`);
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
