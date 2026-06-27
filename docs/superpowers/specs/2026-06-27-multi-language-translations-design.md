# Multi-language trip translations — design

**Date:** 2026-06-27
**Status:** Approved (pending spec review)

## Problem

Admins can mark a trip with a single optional destination language (`Trip.nativeLang`)
and hand-type a native-language *title* per activity (`Item.local`) and accommodation
(`Stay.localName`). Travelers toggle English ↔ that one language.

We want to:

1. Let an admin set **multiple** languages on a trip (English is always the base).
2. **Translate** activity and accommodation **names and descriptions** (plus place,
   tag, tip, and day theme) into every added language, AI-assisted, admin-editable.
3. Let **travelers pick any** of the trip's languages in the traveler view.
4. Fold translation into the existing **"Ask AI"** action so one tap produces a fully
   localized activity.

## Decisions (from brainstorming)

- **Language model:** English base + any number of added languages. Travelers pick one.
- **Translation source:** AI auto (Gemini), admin can edit; translations stored on the
  trip so the PWA stays offline-capable.
- **Field scope:** activity `title`, `note`, `place`, `tag`, `tip`; day `theme`;
  accommodation (`Stay`) `name`, `desc`. The phrasebook is **out of scope**.
- **Trigger:** per-entity Translate buttons **plus** "Ask AI" chaining translation.
- **Storage:** per-entity `t` override map keyed by language code (Approach A below).

## Approach A — per-entity translation maps (chosen)

Each translatable entity carries an optional `t` map: language code → partial field
overrides. A pure resolver merges English with the chosen language's overrides at read
time. Rejected alternatives: a trip-level dictionary keyed by entity path (items have no
stable IDs — reorder/delete orphans entries), and per-field `{en, th, …}` maps (rewrites
every component and all seed data).

### Type changes (`src/types.ts`)

```ts
// Translatable field subsets
type ItemTranslation = Partial<Pick<Item, "title" | "note" | "place" | "tag" | "tip">>;
type StayTranslation = Partial<Pick<Stay, "name" | "desc">>;
interface DayTranslation { theme?: string }

interface Item {
  // …existing English fields…
  /** Per-language overrides, keyed by Lang.code. English is the base (no entry). */
  t?: Record<string, ItemTranslation>;
}
interface Stay {
  // …existing fields…
  t?: Record<string, StayTranslation>;
}
interface Day {
  // …existing fields…
  t?: Record<string, DayTranslation>;
}
interface Trip {
  // …existing fields, MINUS nativeLang…
  /** Added non-English languages. English is always the implicit base. */
  languages: Lang[];
}
```

Removed: `Trip.nativeLang`, `Item.local`, `Stay.localName` (migrated on read).
`Lang` (`{ code, label }`) is unchanged.

### Resolver (`src/lib/localize.ts`, new)

```ts
export function localizeItem(item: Item, lang: string): Item;
export function localizeStay(stay: Stay, lang: string): Stay;
export function localizeDayTheme(day: Day, lang: string): string;
```

- `lang === "en"` or no `t[lang]` → return the input unchanged (identity).
- Otherwise return a new object: English fields shallow-merged with the **defined,
  non-empty** overrides for `lang` (empty strings do not clobber English).
- Pure and immutable; never mutates the input.

Consumers localize the **entity first**, then existing view code runs unchanged:

- `buildViewItems(day, lang)` maps each item through `localizeItem` before building the
  `ViewItem`. Because `ViewItem.item` is the localized copy, `DetailSheet` (which reads
  `item.note` / `item.tip` / `item.cost` directly) shows translated text with no edits.
- `TravelerApp` passes `prefLang` (any code) instead of the `useLocalLang` boolean.
- `DetailsScreen` / `DayScreen` localize the day theme and stay via the resolver.

### AI (`src/lib/ai.ts`)

```ts
export function translateItem(item: Item, langs: Lang[], dest: string): Promise<Record<string, ItemTranslation>>;
export function translateStay(stay: Stay, langs: Lang[]): Promise<Record<string, StayTranslation>>;
export function translateDayTheme(theme: string, langs: Lang[]): Promise<Record<string, DayTranslation>>;
```

- One Gemini `generateContent` call per entity, translating all its **non-empty** fields
  into **all** target languages at once.
- Use JSON structured output (`responseMimeType: "application/json"` + `responseSchema`)
  for reliable parsing; no `googleSearch` tool (translation, not research).
- Reuses the existing lazy `getAiInstance()` / dynamic `firebase/ai` import.
- Returns only languages/fields the model produced; callers merge into existing `t`.
- Empty `langs` → resolves to `{}` without an API call.

### Admin — Settings (`src/components/admin/SettingsTab.tsx`)

New "Languages" card:
- Curated preset list of `Lang` options (e.g. Thai, Japanese, Chinese (Simplified),
  Chinese (Traditional), Korean, Spanish, French, German, Italian, Vietnamese,
  Indonesian) in a new `src/lib/languages.ts`.
- A dropdown adds a language; added languages render as removable chips.
- Removing a language **prunes** its `t` entries across all items/stays/days.

### Admin — translation triggers

- **"Ask AI"** (`Editor.tsx` `askAI`): after generating the English `note` + `image`,
  build the updated item and call `translateItem` for `trip.languages`, then commit
  `{ note, image?, t }` in a **single** `update()`. No-op translation when
  `trip.languages` is empty. Errors in the translate step surface a toast but still
  save the English content.
- **Standalone "Translate" buttons** (`DaysTab.tsx`): on each activity card (re-translate
  hand-edited text without regenerating), the accommodation card, and beside the
  day-title. Each shown only when `trip.languages.length > 0`. A per-target busy key
  drives the spinner, mirroring `aiBusyKey`.

New helpers in `src/lib/editTrip.ts` (all pure/immutable):
```ts
setTripLanguages(trip, langs): Trip          // also prunes orphaned t entries
addTripLanguage(trip, lang): Trip
removeTripLanguage(trip, code): Trip          // prunes t[code] everywhere
setItemTranslations(trip, di, ii, map): Trip  // merge into item.t
setStayTranslations(trip, di, map): Trip
setDayTranslations(trip, di, map): Trip
```

### Traveler (`TravelerApp.tsx`, `DetailsScreen.tsx`)

- `prefLang` is any language code; default `"en"`.
- Language card lists English + every `trip.languages` entry (replaces the 2-option
  en/native toggle). Shown only when `trip.languages.length > 0`.
- Persist the choice in `localStorage` under a per-trip key
  (`yl.lang.<tripId>`), read on mount, so reload keeps the language. Falls back to
  `"en"` if the stored code is no longer in the trip.

### Migration (`toTrip` in `src/lib/trips.ts`)

Pure normalization on every read, so existing documents keep working:
- `data.languages ?? (data.nativeLang ? [data.nativeLang] : [])` → `trip.languages`.
- For each item: if legacy `item.local` and a native code exists, fold into
  `t[code].title`; drop `local`.
- For each stay (per-day + `trip.hotel`): fold `localName` → `t[code].name`; drop it.
- Drop `nativeLang` from the returned object.

`blankTrip` returns `languages: []` instead of `nativeLang: null`. Seed data
(`src/data/seedTrips.ts`, `src/data/chinaTrip.ts`) updated to the new shape.

### Firestore rules

No change. Trips are written whole by the owner; rules do not validate field shape, so
the new `languages` array and nested `t` maps are already permitted.

## Testing (vitest, Node env — pure functions only, matching existing `test/`)

- **`localize`**: en passthrough, missing-language passthrough, partial override merge,
  empty-string overrides do not clobber English, immutability.
- **`editTrip`** translation/language helpers: set/add/remove language, prune-on-removal
  across items/stays/days, merge translations without dropping other languages,
  immutability.
- **Migration normalizer**: `nativeLang` → `languages`; `local`/`localName` → `t`;
  already-migrated docs pass through unchanged.
- AI is mocked; no live calls in tests.

## Accepted limitations

- **No stale tracking.** Editing English after translating leaves the prior translation
  until the admin re-runs Translate / Ask AI. (Per the chosen per-item trigger; stale
  badges can be added later.)
- Translation quality depends on Gemini; admin edit is the correction path.

## Out of scope

- Translating the phrasebook, contacts, or trip title/destination.
- RTL layout handling (no RTL languages in the preset list initially).
- Automatic re-translation on English edits.
