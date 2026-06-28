import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../../src/styles/global.css";
import type { Trip } from "../../src/types";
import type { RawTripData } from "../../src/lib/migrateTrip";
import { normalizeTrip } from "../../src/lib/migrateTrip";
import { AppShell } from "../../src/components/AppShell";
import { TravelerApp } from "../../src/components/traveler/TravelerApp";
import { chinaTrip } from "../../src/data/chinaTrip";

// Normalize the raw seed trip (SeedTrip → RawTripData → TripData) then attach
// the document id to get a full Trip, mirroring `toTrip()` in src/lib/trips.ts.
const raw: RawTripData = { ...chinaTrip, ownerId: "demo" };
const trip: Trip = {
  ...normalizeTrip(raw),
  id: "demo",
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppShell>
      <TravelerApp trip={trip} />
    </AppShell>
  </StrictMode>,
);
