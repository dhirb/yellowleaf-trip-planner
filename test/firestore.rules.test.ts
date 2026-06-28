import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const ADMIN_UID = "admin-1";
const OTHER_ADMIN_UID = "admin-2";
const NON_ADMIN_UID = "viewer-1";
const CO_OWNER_UID = "admin-3";
const CO_OWNER_EMAIL = "coowner@example.com";

const rulesPath = fileURLToPath(new URL("../firestore.rules", import.meta.url));

let testEnv: RulesTestEnvironment;

/** A minimal valid trip document owned by `ownerId`. */
function tripDoc(
  ownerId: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    ownerId,
    title: "Kyoto",
    dest: "Kyoto",
    country: "Japan",
    cover: "#C2541F",
    published: true,
    languages: [],
    currency: {
      code: "JPY",
      symbol: "¥",
      home: "USD",
      homeSymbol: "$",
      perHome: 150,
    },
    hotel: { name: "", desc: "", address: "", phone: "" },
    contacts: [],
    phrases: [],
    days: [
      {
        date: "2026-07-01",
        theme: "Day 1",
        weather: "",
        items: [],
        stay: null,
        flights: [],
      },
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

/** Seed a document with security rules bypassed. */
async function seed(
  path: string,
  data: Record<string, unknown>,
): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), path), data);
  });
}

// Auth contexts. Admin role is delivered as a token claim, mirroring the custom
// claim that scripts/provisionUser.ts sets in production.
const admin = () =>
  testEnv.authenticatedContext(ADMIN_UID, { role: "admin" }).firestore();
const otherAdmin = () =>
  testEnv.authenticatedContext(OTHER_ADMIN_UID, { role: "admin" }).firestore();
const nonAdmin = () => testEnv.authenticatedContext(NON_ADMIN_UID).firestore();
const anon = () => testEnv.unauthenticatedContext().firestore();
// A provisioned admin granted co-owner access via their token email.
const coOwner = () =>
  testEnv
    .authenticatedContext(CO_OWNER_UID, {
      role: "admin",
      email: CO_OWNER_EMAIL,
    })
    .firestore();
// Same email, but not a provisioned admin (writes are still gated by isAdmin).
const coOwnerNoRole = () =>
  testEnv
    .authenticatedContext(CO_OWNER_UID, { email: CO_OWNER_EMAIL })
    .firestore();

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "yellowleaf-rules-test",
    firestore: {
      rules: readFileSync(rulesPath, "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe("trips: hard delete is forbidden for everyone", () => {
  it("an admin owner cannot delete their own trip document", async () => {
    await seed("trips/t1", tripDoc(ADMIN_UID));
    await assertFails(deleteDoc(doc(admin(), "trips/t1")));
  });

  it("an admin owner cannot delete a trip already soft-deleted", async () => {
    await seed("trips/t1", tripDoc(ADMIN_UID, { deletedAt: Timestamp.now() }));
    await assertFails(deleteDoc(doc(admin(), "trips/t1")));
  });

  it("a non-admin cannot delete a trip", async () => {
    await seed("trips/t1", tripDoc(ADMIN_UID));
    await assertFails(deleteDoc(doc(nonAdmin(), "trips/t1")));
  });
});

describe("trips: soft delete is an allowed update for the owning admin", () => {
  it("the owning admin can set deletedAt", async () => {
    await seed("trips/t1", tripDoc(ADMIN_UID));
    await assertSucceeds(
      updateDoc(doc(admin(), "trips/t1"), {
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("a different admin (not the owner) cannot soft-delete the trip", async () => {
    await seed("trips/t1", tripDoc(ADMIN_UID));
    await assertFails(
      updateDoc(doc(otherAdmin(), "trips/t1"), {
        deletedAt: serverTimestamp(),
      }),
    );
  });

  it("a non-admin cannot soft-delete the trip", async () => {
    await seed("trips/t1", tripDoc(ADMIN_UID));
    await assertFails(
      updateDoc(doc(nonAdmin(), "trips/t1"), { deletedAt: serverTimestamp() }),
    );
  });

  it("an update may not reassign ownership", async () => {
    await seed("trips/t1", tripDoc(ADMIN_UID));
    await assertFails(
      updateDoc(doc(admin(), "trips/t1"), { ownerId: OTHER_ADMIN_UID }),
    );
  });
});

describe("trips: reads hide soft-deleted trips from the public", () => {
  it("anyone may read a published, non-deleted trip", async () => {
    await seed("trips/t1", tripDoc(ADMIN_UID));
    await assertSucceeds(getDoc(doc(anon(), "trips/t1")));
  });

  it("a published but soft-deleted trip is not publicly readable", async () => {
    await seed("trips/t1", tripDoc(ADMIN_UID, { deletedAt: Timestamp.now() }));
    await assertFails(getDoc(doc(anon(), "trips/t1")));
  });

  it("an unpublished trip is not publicly readable", async () => {
    await seed("trips/t1", tripDoc(ADMIN_UID, { published: false }));
    await assertFails(getDoc(doc(anon(), "trips/t1")));
  });

  it("the owner can still read their own soft-deleted trip", async () => {
    await seed("trips/t1", tripDoc(ADMIN_UID, { deletedAt: Timestamp.now() }));
    await assertSucceeds(getDoc(doc(admin(), "trips/t1")));
  });
});

describe("trips: create is restricted to provisioned admins acting as themselves", () => {
  it("an admin may create a trip owned by themselves", async () => {
    await assertSucceeds(setDoc(doc(admin(), "trips/new"), tripDoc(ADMIN_UID)));
  });

  it("an admin may not create a trip owned by someone else", async () => {
    await assertFails(
      setDoc(doc(admin(), "trips/new"), tripDoc(OTHER_ADMIN_UID)),
    );
  });

  it("a non-admin may not create a trip", async () => {
    await assertFails(
      setDoc(doc(nonAdmin(), "trips/new"), tripDoc(NON_ADMIN_UID)),
    );
  });
});

describe("trips: co-owners can edit content but not manage access", () => {
  const shared = { coOwnerEmails: [CO_OWNER_EMAIL], published: false };

  it("a co-owner can read a draft trip shared with them", async () => {
    await seed("trips/t1", tripDoc(ADMIN_UID, shared));
    await assertSucceeds(getDoc(doc(coOwner(), "trips/t1")));
  });

  it("a co-owner can edit trip content", async () => {
    await seed("trips/t1", tripDoc(ADMIN_UID, shared));
    await assertSucceeds(
      updateDoc(doc(coOwner(), "trips/t1"), {
        title: "Edited by co-owner",
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("a co-owner cannot change the co-owner list", async () => {
    await seed("trips/t1", tripDoc(ADMIN_UID, shared));
    await assertFails(
      updateDoc(doc(coOwner(), "trips/t1"), { coOwnerEmails: [] }),
    );
  });

  it("a co-owner cannot soft-delete the trip", async () => {
    await seed("trips/t1", tripDoc(ADMIN_UID, shared));
    await assertFails(
      updateDoc(doc(coOwner(), "trips/t1"), { deletedAt: serverTimestamp() }),
    );
  });

  it("a co-owner without the admin role cannot edit content", async () => {
    await seed("trips/t1", tripDoc(ADMIN_UID, shared));
    await assertFails(
      updateDoc(doc(coOwnerNoRole(), "trips/t1"), { title: "Nope" }),
    );
  });

  it("the owner can add and remove co-owners", async () => {
    await seed("trips/t1", tripDoc(ADMIN_UID, { published: false }));
    await assertSucceeds(
      updateDoc(doc(admin(), "trips/t1"), {
        coOwnerEmails: [CO_OWNER_EMAIL],
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("an admin who is neither owner nor co-owner cannot read a draft", async () => {
    await seed("trips/t1", tripDoc(ADMIN_UID, shared));
    await assertFails(getDoc(doc(otherAdmin(), "trips/t1")));
  });

  it("an admin who is neither owner nor co-owner cannot edit content", async () => {
    await seed("trips/t1", tripDoc(ADMIN_UID, shared));
    await assertFails(
      updateDoc(doc(otherAdmin(), "trips/t1"), { title: "Nope" }),
    );
  });

  // These mirror the two live queries in subscribeOwnerTrips. Query
  // authorization is stricter than single-doc reads, so we exercise it directly.
  it("the owner's ownerId query is authorized", async () => {
    await seed("trips/t1", tripDoc(ADMIN_UID, { published: false }));
    await assertSucceeds(
      getDocs(
        query(collection(admin(), "trips"), where("ownerId", "==", ADMIN_UID)),
      ),
    );
  });

  it("a co-owner's array-contains query on their own email is authorized", async () => {
    await seed("trips/t1", tripDoc(ADMIN_UID, shared));
    await assertSucceeds(
      getDocs(
        query(
          collection(coOwner(), "trips"),
          where("coOwnerEmails", "array-contains", CO_OWNER_EMAIL),
        ),
      ),
    );
  });

  it("an array-contains query for someone else's email is denied", async () => {
    await seed("trips/t1", tripDoc(ADMIN_UID, shared));
    await assertFails(
      getDocs(
        query(
          collection(coOwner(), "trips"),
          where("coOwnerEmails", "array-contains", "stranger@example.com"),
        ),
      ),
    );
  });
});

describe("users + catch-all: no client deletes or writes anywhere else", () => {
  it("a user may read only their own user record", async () => {
    await seed(`users/${NON_ADMIN_UID}`, { role: "viewer" });
    await assertSucceeds(getDoc(doc(nonAdmin(), `users/${NON_ADMIN_UID}`)));
    await assertFails(getDoc(doc(nonAdmin(), `users/${ADMIN_UID}`)));
  });

  it("a user cannot write or delete a user record", async () => {
    await seed(`users/${NON_ADMIN_UID}`, { role: "viewer" });
    await assertFails(
      setDoc(doc(nonAdmin(), `users/${NON_ADMIN_UID}`), { role: "admin" }),
    );
    await assertFails(deleteDoc(doc(nonAdmin(), `users/${NON_ADMIN_UID}`)));
  });

  it("an unknown collection is fully denied, including deletes", async () => {
    await seed("secrets/s1", { value: 1 });
    await assertFails(getDoc(doc(admin(), "secrets/s1")));
    await assertFails(deleteDoc(doc(admin(), "secrets/s1")));
  });
});
