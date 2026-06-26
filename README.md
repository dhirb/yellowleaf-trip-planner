# Yellowleaf · Trip Planner

A calm, large-type travel itinerary you can build and share with the people you love.
Implemented from a Claude Design prototype as a real, Firebase-backed app.

It has two personas:

- **Traveler** (`/t/:tripId`) — opens a shared trip (entering an access code if it's
  private), then browses **Today** (a swipeable day with timeline / cards / simple
  layouts, flights, accommodation and a detail sheet), a **Calendar**, and **Details**
  (a currency converter, language toggle, call-able contacts, the hotel, and useful phrases).
- **Admin** (`/admin`) — signs in with email/password, sees their **trips list**, and edits
  a trip in an **Itinerary** tab (days, flights, activities with an AI assist, accommodation)
  and a **Settings** tab (name, dates, public/private + access code, share link, contacts,
  publish).

## Tech stack

- **Vite 8** · **React 19** · **TypeScript 6**
- **Firebase** — Authentication (email/password), Cloud Firestore, Hosting, and
  **Firebase AI Logic** (Gemini) for the admin "Ask AI" feature
- **react-router-dom** for routing

## Project structure

```
src/
  firebase.ts            Firebase app/auth/firestore init from env
  types.ts               Domain types (Trip, Day, Item, Flight, Contact, …)
  lib/                   date, currency, ids, icons, ui styles, ai, trips (data layer), editTrip
  hooks/                 useAuth, useTrip, useTrips, useTripEditor, useSwipe, useToast, useViewport
  components/
    PhoneFrame, StatusBar, Toast, AuthProvider, ui/
    traveler/            TravelerRoute, TravelerApp, Lock/Day/Calendar/Details screens, DetailSheet, TabBar, DayStrip, DayItems
    admin/               AdminApp, LoginScreen, TripsList, Editor, DaysTab, SettingsTab
  data/seedTrips.ts      Demo trips (used only by the optional seed script)
scripts/seed.ts          Optional one-off Firestore seeder (npm run seed)
firebase.json            Hosting (security headers + SPA rewrite) + Firestore config
firestore.rules          Functional, secure default rules
```

## Prerequisites

- Node 20+
- A Firebase project ([console.firebase.google.com](https://console.firebase.google.com))
- Firebase CLI: `npm i -g firebase-tools` then `firebase login`

## 1. Configure Firebase

In the Firebase console for your project:

1. **Authentication → Sign-in method →** enable **Email/Password**.
2. **Firestore Database →** create a database (production mode is fine; the rules in
   `firestore.rules` are deployed below).
3. **Build → AI Logic →** click **Get started** and enable the **Gemini Developer API**
   (free Spark tier is enough for text). _Imagen image generation additionally requires the
   Blaze plan — the app falls back to a placeholder image on the free tier, so this is
   optional._
4. **Project settings → General → Your apps →** add a **Web app** and copy the config.

Then create your local env file:

```bash
cp .env.example .env
# paste your Firebase web config values into .env
```

> The `VITE_FIREBASE_*` values are embedded in the client bundle — that's expected for
> Firebase web config and is not a secret. Your data is protected by the Firestore
> security rules, not by hiding these values.

Point the CLI at your project:

```bash
firebase use --add        # pick your project, alias it "default"
```

## 2. Run locally

```bash
npm install
npm run dev               # http://localhost:5173  → redirects to /admin
```

Create an account on the admin sign-in screen, then **+ New trip** to start building.
Open a published trip at `/t/<tripId>` (the editor's Settings tab shows the share link).

### Firebase emulators (optional)

```bash
npm run emulators         # Auth + Firestore + Hosting UI
```

Note: **Firebase AI Logic is not emulated** — "Ask AI" calls the live Gemini API.

## 3. Build & deploy

```bash
npm run build             # tsc + vite build → dist/
firebase deploy           # Hosting + Firestore rules (uses firebase.json)
# or selectively:
firebase deploy --only hosting
firebase deploy --only firestore:rules
```

## Firestore data model & rules

One document per trip in the `trips` collection; days/items/flights are embedded arrays
(trips are small). See `src/types.ts` for the full shape.

Security rules (`firestore.rules`):

- **Read** — anyone may read a **published** trip (the public link, or a private trip whose
  access code is checked client-side); owners may always read their own drafts.
- **Create** — a signed-in user may create a trip only as themselves.
- **Update/Delete** — only the trip's owner, and ownership can't be reassigned.

> **Security note — private-trip access codes.** A private trip's `password` lives in the
> trip document, so the access code is a *soft, client-side gate* (matching the original
> prototype), not cryptographic protection: anyone able to read a published private trip can
> read its code. For stronger protection, move the gate server-side (e.g. a Cloud Function
> that exchanges a code for the trip, with the code kept out of client-readable fields). That
> hardening is intentionally out of scope for the default rules here.

## The "Ask AI" assist

In the admin editor, each activity has an **Ask AI** button backed by **Firebase AI Logic**
(`src/lib/ai.ts`, dynamically imported so it stays out of the initial bundle):

- A warm, short description is generated with **Gemini** (`gemini-2.5-flash`) — works on the
  free Spark plan once AI Logic is enabled.
- An image is generated with **Imagen** when available (Blaze plan); otherwise it falls back
  to a deterministic placeholder so the button never fails.

## Optional: seed demo trips

The three demo trips (Kyoto / Lisbon / Hội An) are **not** loaded automatically. To add them:

```bash
# After creating an admin account in the app, set credentials and run:
SEED_EMAIL=you@example.com SEED_PASSWORD=your-password npm run seed
```

They are created owned by that account, so the Firestore rules permit them.

## Security headers

`firebase.json` sets a production-grade header set on Hosting: HSTS, `X-Content-Type-Options`,
`X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, and a `Content-Security-Policy`
scoped to Firebase, Google Fonts, and the image hosts. Verify after deploy with `curl -I`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Oxlint |
| `npm run emulators` | Firebase Auth/Firestore/Hosting emulators |
| `npm run seed` | Optional: load the demo trips into Firestore |
