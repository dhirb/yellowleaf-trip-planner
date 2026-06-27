# Multi-language Trip Translations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins add multiple languages to a trip, AI-translate activity/accommodation names and descriptions (plus place, tag, tip, day theme) into each, and let travelers pick any language.

**Architecture:** Each translatable entity (`Item`/`Stay`/`Day`) carries an optional `t` map keyed by language code → partial field overrides. A pure resolver (`localize.ts`) merges English with the chosen language at read time, so existing views/DetailSheet need no rework. A single `normalizeTrip` migration folds legacy `nativeLang`/`local`/`localName` into the new model on Firestore read and is reused for seed authoring. Gemini (existing `firebase/ai` seam) produces translations on demand; "Ask AI" chains translation.

**Tech Stack:** React 19, TypeScript, Vite, Firebase (Firestore + AI Logic / Gemini), Vitest, Tailwind.

**Spec:** `docs/superpowers/specs/2026-06-27-multi-language-translations-design.md`

---

## File Structure

**Create:**
- `src/lib/localize.ts` — pure resolver: `localizeItem`, `localizeStay`, `localizeDayTheme`.
- `src/lib/languages.ts` — curated `Lang` preset list for the admin picker.
- `src/lib/migrateTrip.ts` — `normalizeTrip(raw)` + legacy `Raw*` input types.
- `test/localize.test.ts`, `test/migrateTrip.test.ts` — unit tests.

**Modify:**
- `src/types.ts` — add `Trip.languages`, `Item.t`/`Stay.t`/`Day.t`, translation types; loosen then remove legacy fields.
- `src/lib/trips.ts` — wire `normalizeTrip` into `toTrip`; `blankTrip` uses `languages`.
- `src/lib/editTrip.ts` — language + translation helpers.
- `src/lib/ai.ts` — `translateItem`/`translateStay`/`translateDayTheme` + `pickItemFields`.
- `src/lib/dayView.ts` — `buildViewItems(day, lang)` localizes entities.
- `src/components/traveler/TravelerApp.tsx` — `prefLang` (any code) + `localStorage`.
- `src/components/traveler/DayScreen.tsx` — `lang` prop; localize stay + theme.
- `src/components/traveler/DetailsScreen.tsx` — multi-language picker; localize hotel.
- `src/components/admin/SettingsTab.tsx` — Languages card.
- `src/components/admin/DaysTab.tsx` — Translate buttons.
- `src/components/admin/Editor.tsx` — translate handlers; Ask AI chains translation.
- `src/data/seedTrips.ts`, `src/data/chinaTrip.ts` — rebase `SeedTrip` on `RawTripData` (data-only files with no importers; they only need to compile).
- `test/editTrip.test.ts` — extend with new helper tests.

---

## Task 1: Types — additive new fields

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add translation types and entity `t` maps**

In `src/types.ts`, add after the `Lang` interface:

```ts
/** Per-language field overrides for an Item (English is the base). */
export type ItemTranslation = Partial<
  Pick<Item, "title" | "note" | "place" | "tag" | "tip">
>;
/** Per-language field overrides for a Stay. */
export type StayTranslation = Partial<Pick<Stay, "name" | "desc">>;
/** Per-language field overrides for a Day. */
export interface DayTranslation {
  theme?: string;
}
```

Add `t?` to the three entity interfaces:

```ts
export interface Item {
  // …existing fields…
  /** Per-language overrides, keyed by Lang.code. */
  t?: Record<string, ItemTranslation>;
}

export interface Stay {
  // …existing fields…
  t?: Record<string, StayTranslation>;
}

export interface Day {
  // …existing fields…
  t?: Record<string, DayTranslation>;
}
```

On `Trip`, add `languages` and **loosen** `nativeLang` to optional (kept for back-compat until Task 11):

```ts
export interface Trip {
  // …existing fields…
  /** Added non-English languages. English is always the implicit base. */
  languages?: Lang[];
  /** @deprecated migrated into `languages` on read. */
  nativeLang?: Lang | null;
  // …rest…
}
```

(Leave `Item.local` and `Stay.localName` as-is for now.)

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc -b`
Expected: PASS (purely additive/loosening; no consumer breaks).

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat(types): add languages and per-entity translation maps"
```

---

## Task 2: Language presets

**Files:**
- Create: `src/lib/languages.ts`

- [ ] **Step 1: Create the preset list**

```ts
import type { Lang } from "../types";

/** Curated languages an admin can add to a trip. English is always the base. */
export const LANGUAGE_PRESETS: Lang[] = [
  { code: "th", label: "ไทย (Thai)" },
  { code: "ja", label: "日本語 (Japanese)" },
  { code: "zh-Hans", label: "简体中文 (Chinese, Simplified)" },
  { code: "zh-Hant", label: "繁體中文 (Chinese, Traditional)" },
  { code: "ko", label: "한국어 (Korean)" },
  { code: "es", label: "Español (Spanish)" },
  { code: "fr", label: "Français (French)" },
  { code: "de", label: "Deutsch (German)" },
  { code: "it", label: "Italiano (Italian)" },
  { code: "pt", label: "Português (Portuguese)" },
  { code: "vi", label: "Tiếng Việt (Vietnamese)" },
  { code: "id", label: "Bahasa Indonesia (Indonesian)" },
];
```

- [ ] **Step 2: Verify**

Run: `npx tsc -b`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/languages.ts
git commit -m "feat: add language preset list"
```

---

## Task 3: Resolver (`localize.ts`) — TDD

**Files:**
- Create: `src/lib/localize.ts`
- Test: `test/localize.test.ts`

- [ ] **Step 1: Write the failing test**

`test/localize.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import type { Day, Item, Stay } from "../src/types";
import { localizeItem, localizeStay, localizeDayTheme } from "../src/lib/localize";

const item: Item = {
  kind: "attraction",
  time: "09:00",
  title: "Golden Pavilion",
  place: "Kyoto",
  tag: "Temple",
  note: "A famous gilded temple.",
  tip: "Go early.",
  t: { ja: { title: "金閣寺", place: "京都", note: "" } },
};

describe("localizeItem", () => {
  it("returns the input unchanged for English", () => {
    expect(localizeItem(item, "en")).toBe(item);
  });

  it("returns the input unchanged when no translation exists", () => {
    expect(localizeItem(item, "fr")).toBe(item);
  });

  it("merges defined overrides over English fields", () => {
    const out = localizeItem(item, "ja");
    expect(out.title).toBe("金閣寺");
    expect(out.place).toBe("京都");
    expect(out.tag).toBe("Temple"); // untranslated falls back to English
  });

  it("ignores empty-string overrides (does not clobber English)", () => {
    expect(localizeItem(item, "ja").note).toBe("A famous gilded temple.");
  });

  it("does not mutate the input", () => {
    localizeItem(item, "ja");
    expect(item.title).toBe("Golden Pavilion");
  });
});

describe("localizeStay", () => {
  const stay: Stay = { name: "Hotel Granvia", desc: "By the station", t: { ja: { name: "ホテルグランヴィア" } } };
  it("merges the translated name and keeps English desc", () => {
    const out = localizeStay(stay, "ja");
    expect(out.name).toBe("ホテルグランヴィア");
    expect(out.desc).toBe("By the station");
  });
  it("passes through for English", () => {
    expect(localizeStay(stay, "en")).toBe(stay);
  });
});

describe("localizeDayTheme", () => {
  const day = { date: "2026-01-01", theme: "Arrival", weather: "", items: [], stay: null, flights: [], t: { ja: { theme: "到着" } } } as unknown as Day;
  it("returns the translated theme", () => {
    expect(localizeDayTheme(day, "ja")).toBe("到着");
  });
  it("falls back to English theme when missing", () => {
    expect(localizeDayTheme(day, "fr")).toBe("Arrival");
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `npx vitest run test/localize.test.ts`
Expected: FAIL with "Cannot find module '../src/lib/localize'".

- [ ] **Step 3: Implement `src/lib/localize.ts`**

```ts
import type { Day, Item, Stay } from "../types";

/**
 * Merge defined, non-empty string overrides over a base object, immutably.
 * Empty strings are skipped so a blank translation never clobbers English.
 * Returns the original reference when nothing changes (cheap for memoisation).
 */
function applyOverrides<T extends object>(base: T, over: Partial<T> | undefined): T {
  if (!over) return base;
  let out: T | null = null;
  for (const key of Object.keys(over) as (keyof T)[]) {
    const value = over[key];
    if (value == null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (!out) out = { ...base };
    out[key] = value as T[keyof T];
  }
  return out ?? base;
}

/** Return a copy of `item` with the chosen language's overrides applied. */
export function localizeItem(item: Item, lang: string): Item {
  if (lang === "en") return item;
  return applyOverrides(item, item.t?.[lang]);
}

/** Return a copy of `stay` with the chosen language's overrides applied. */
export function localizeStay(stay: Stay, lang: string): Stay {
  if (lang === "en") return stay;
  return applyOverrides(stay, stay.t?.[lang]);
}

/** The day's theme in the chosen language, falling back to English. */
export function localizeDayTheme(day: Day, lang: string): string {
  if (lang === "en") return day.theme;
  const t = day.t?.[lang]?.theme;
  return t && t.trim() !== "" ? t : day.theme;
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `npx vitest run test/localize.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/lib/localize.ts test/localize.test.ts
git commit -m "feat: add language resolver with tests"
```

---

## Task 4: Migration (`migrateTrip.ts`) — TDD

**Files:**
- Create: `src/lib/migrateTrip.ts`
- Test: `test/migrateTrip.test.ts`

- [ ] **Step 1: Write the failing test**

`test/migrateTrip.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { normalizeTrip, type RawTripData } from "../src/lib/migrateTrip";

function legacy(): RawTripData {
  return {
    ownerId: "u1",
    title: "Kyoto",
    dest: "Kyoto",
    country: "Japan",
    cover: "#fff",
    visibility: "public",
    password: "",
    published: true,
    nativeLang: { code: "ja", label: "日本語" },
    currency: { code: "JPY", symbol: "¥", home: "AUD", homeSymbol: "A$", perHome: 100 },
    hotel: { name: "Granvia", localName: "グランヴィア" },
    contacts: [],
    phrases: [{ en: "Hello", local: "Konnichiwa", pron: "kon" }],
    days: [
      {
        date: "2026-01-01",
        theme: "Arrival",
        weather: "",
        flights: [],
        stay: { name: "Granvia", localName: "グランヴィア" },
        items: [{ kind: "attraction", time: "09:00", title: "Kinkaku-ji", local: "金閣寺" }],
      },
    ],
  } as RawTripData;
}

describe("normalizeTrip", () => {
  it("derives languages from nativeLang", () => {
    expect(normalizeTrip(legacy()).languages).toEqual([{ code: "ja", label: "日本語" }]);
  });

  it("folds item.local into t[code].title and drops local", () => {
    const item = normalizeTrip(legacy()).days[0].items[0];
    expect(item.t?.ja?.title).toBe("金閣寺");
    expect("local" in item).toBe(false);
  });

  it("folds stay.localName and hotel.localName into t[code].name", () => {
    const out = normalizeTrip(legacy());
    expect(out.days[0].stay?.t?.ja?.name).toBe("グランヴィア");
    expect(out.hotel.t?.ja?.name).toBe("グランヴィア");
    expect("localName" in (out.days[0].stay as object)).toBe(false);
  });

  it("leaves the phrasebook untouched", () => {
    expect(normalizeTrip(legacy()).phrases[0].local).toBe("Konnichiwa");
  });

  it("drops nativeLang from output", () => {
    expect("nativeLang" in normalizeTrip(legacy())).toBe(false);
  });

  it("is idempotent for already-migrated trips", () => {
    const once = normalizeTrip(legacy());
    const twice = normalizeTrip(once as unknown as RawTripData);
    expect(twice.languages).toEqual(once.languages);
    expect(twice.days[0].items[0].t?.ja?.title).toBe("金閣寺");
  });

  it("defaults languages to [] when absent", () => {
    const raw = { ...legacy(), nativeLang: undefined };
    expect(normalizeTrip(raw).languages).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `npx vitest run test/migrateTrip.test.ts`
Expected: FAIL with "Cannot find module '../src/lib/migrateTrip'".

- [ ] **Step 3: Implement `src/lib/migrateTrip.ts`**

```ts
import type { Day, Item, Lang, Stay, TripData } from "../types";

/** Legacy input shapes: what old Firestore docs and seed literals carry. */
export type RawItem = Item & { local?: string };
export type RawStay = Stay & { localName?: string };
export type RawDay = Omit<Day, "items" | "stay"> & {
  items?: RawItem[];
  stay?: RawStay | null;
};
export type RawTripData = Omit<
  TripData,
  "days" | "hotel" | "languages" | "nativeLang"
> & {
  languages?: Lang[];
  nativeLang?: Lang | null;
  days: RawDay[];
  hotel: RawStay;
};

/** Fold a legacy `local` title into the language's title override. */
function migrateItem(item: RawItem, code: string | null): Item {
  const { local, ...rest } = item;
  if (local && code) {
    const t = { ...(rest.t ?? {}) };
    t[code] = { title: local, ...(t[code] ?? {}) };
    return { ...rest, t };
  }
  return { ...rest };
}

/** Fold a legacy `localName` into the language's name override. */
function migrateStay(stay: RawStay | null | undefined, code: string | null): Stay | null {
  if (!stay) return null;
  const { localName, ...rest } = stay;
  if (localName && code) {
    const t = { ...(rest.t ?? {}) };
    t[code] = { name: localName, ...(t[code] ?? {}) };
    return { ...rest, t };
  }
  return { ...rest };
}

/**
 * Normalise a stored/seed trip to the current model: derive `languages`,
 * fold legacy `local`/`localName` into `t`, and drop deprecated fields.
 * Idempotent — already-migrated trips pass through unchanged.
 */
export function normalizeTrip(raw: RawTripData): TripData {
  const { nativeLang, days, hotel, ...rest } = raw;
  const languages: Lang[] = raw.languages ?? (nativeLang ? [nativeLang] : []);
  const code = languages[0]?.code ?? null;
  const migratedDays: Day[] = (days ?? []).map((d) => ({
    ...d,
    items: (d.items ?? []).map((it) => migrateItem(it, code)),
    stay: migrateStay(d.stay, code),
  }));
  return {
    ...rest,
    languages,
    days: migratedDays,
    hotel: migrateStay(hotel, code) ?? hotel,
  } as TripData;
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `npx vitest run test/migrateTrip.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/migrateTrip.ts test/migrateTrip.test.ts
git commit -m "feat: add trip migration with tests"
```

---

## Task 5: Wire migration into reads + blankTrip

**Files:**
- Modify: `src/lib/trips.ts`

- [ ] **Step 1: Wire `normalizeTrip` into `toTrip`**

Add the import near the top of `src/lib/trips.ts`:

```ts
import { normalizeTrip, type RawTripData } from "./migrateTrip";
```

Replace the return in `toTrip`:

```ts
  const base = normalizeTrip(data as RawTripData);
  return {
    ...base,
    id: snap.id,
    createdAt,
    updatedAt,
    deletedAt,
  };
```

- [ ] **Step 2: Update `blankTrip`**

In `blankTrip`, replace `nativeLang: null,` with `languages: [],`.

- [ ] **Step 3: Verify**

Run: `npx tsc -b && npx vitest run test/migrateTrip.test.ts test/localize.test.ts`
Expected: PASS.

> Do **not** run bare `npx vitest run` here — the suite includes
> `test/firestore.rules.test.ts`, which needs the Firestore emulator (only provided
> by the `npm test` wrapper). Scope quick runs to the pure-function files, or use
> `npm test` for the full emulator-backed suite (done in Task 11).

- [ ] **Step 4: Commit**

```bash
git add src/lib/trips.ts
git commit -m "feat: normalise trips on read; new trips start with languages"
```

---

## Task 6: Edit helpers — TDD

**Files:**
- Modify: `src/lib/editTrip.ts`
- Test: `test/editTrip.test.ts`

- [ ] **Step 1: Write failing tests** (append to `test/editTrip.test.ts`)

```ts
import {
  addTripLanguage,
  removeTripLanguage,
  setItemTranslations,
  setStayTranslations,
  setDayTranslations,
} from "../src/lib/editTrip";

describe("language helpers", () => {
  it("adds a language without duplicating", () => {
    const t = addTripLanguage(fixture(), { code: "ja", label: "日本語" });
    expect(t.languages).toEqual([{ code: "ja", label: "日本語" }]);
    expect(addTripLanguage(t, { code: "ja", label: "日本語" }).languages).toHaveLength(1);
  });

  it("merges item translations without dropping other languages", () => {
    let t = setItemTranslations(fixture(), 0, 0, { ja: { title: "あ" } });
    t = setItemTranslations(t, 0, 0, { fr: { title: "A" } });
    expect(t.days[0].items[0].t).toEqual({ ja: { title: "あ" }, fr: { title: "A" } });
  });

  it("removing a language prunes its translations everywhere", () => {
    let t = addTripLanguage(fixture(), { code: "ja", label: "日本語" });
    t = setItemTranslations(t, 0, 0, { ja: { title: "あ" } });
    t = setDayTranslations(t, 0, { ja: { theme: "日" } });
    t = removeTripLanguage(t, "ja");
    expect(t.languages).toEqual([]);
    expect(t.days[0].items[0].t?.ja).toBeUndefined();
    expect(t.days[0].t?.ja).toBeUndefined();
  });

  it("does not mutate the input trip", () => {
    const base = fixture();
    addTripLanguage(base, { code: "ja", label: "日本語" });
    expect(base.languages).toEqual([]);
  });
});
```

**Required:** update `fixture()` in this file to set `languages: []` (replace `nativeLang: null`). This is not cosmetic — the "does not mutate" test asserts `base.languages` equals `[]`, which fails if the fixture leaves `languages` undefined.

- [ ] **Step 2: Run, verify it fails**

Run: `npx vitest run test/editTrip.test.ts`
Expected: FAIL ("addTripLanguage is not a function").

- [ ] **Step 3: Implement helpers in `src/lib/editTrip.ts`**

Update the type import line to include the new types:

```ts
import type {
  ContactKind,
  DayTranslation,
  Item,
  ItemTranslation,
  Lang,
  Stay,
  StayTranslation,
  Trip,
} from "../types";
```

Append:

```ts
/** Shallow-merge per-language override maps, immutably. */
function mergeT<V extends object>(
  existing: Record<string, V> | undefined,
  incoming: Record<string, V>,
): Record<string, V> {
  const out: Record<string, V> = { ...(existing ?? {}) };
  for (const code of Object.keys(incoming)) {
    out[code] = { ...(out[code] ?? {}), ...incoming[code] };
  }
  return out;
}

export function addTripLanguage(trip: Trip, lang: Lang): Trip {
  const langs = trip.languages ?? [];
  if (langs.some((l) => l.code === lang.code)) return trip;
  return { ...trip, languages: [...langs, lang] };
}

/** Remove a language and prune its translations from every entity. */
export function removeTripLanguage(trip: Trip, code: string): Trip {
  const next = clone(trip);
  next.languages = (next.languages ?? []).filter((l) => l.code !== code);
  const prune = (e: { t?: Record<string, unknown> } | null | undefined) => {
    if (e?.t) delete e.t[code];
  };
  for (const d of next.days) {
    for (const it of d.items) prune(it);
    prune(d.stay);
    prune(d);
  }
  prune(next.hotel);
  return next;
}

export function setItemTranslations(
  trip: Trip,
  di: number,
  ii: number,
  map: Record<string, ItemTranslation>,
): Trip {
  const next = clone(trip);
  const it = next.days[di].items[ii];
  it.t = mergeT(it.t, map);
  return next;
}

export function setStayTranslations(
  trip: Trip,
  di: number,
  map: Record<string, StayTranslation>,
): Trip {
  const next = clone(trip);
  const stay = next.days[di].stay;
  if (!stay) return trip;
  stay.t = mergeT(stay.t, map);
  return next;
}

export function setDayTranslations(
  trip: Trip,
  di: number,
  map: Record<string, DayTranslation>,
): Trip {
  const next = clone(trip);
  next.days[di].t = mergeT(next.days[di].t, map);
  return next;
}
```

- [ ] **Step 4: Run, verify it passes**

Run: `npx vitest run test/editTrip.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/editTrip.ts test/editTrip.test.ts
git commit -m "feat: add language and translation edit helpers with tests"
```

---

## Task 7: AI translation functions

**Files:**
- Modify: `src/lib/ai.ts`
- Test: `test/ai.test.ts` (pure helper only)

- [ ] **Step 1: Write the failing test for the pure helper**

`test/ai.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import type { Item } from "../src/types";
import { pickItemFields } from "../src/lib/ai";

describe("pickItemFields", () => {
  it("returns only non-empty translatable fields", () => {
    const item: Item = {
      kind: "attraction",
      time: "09:00",
      title: "Kinkaku-ji",
      place: "Kyoto",
      tag: "",
      note: "  ",
      tip: "Go early",
    };
    expect(pickItemFields(item)).toEqual({
      title: "Kinkaku-ji",
      place: "Kyoto",
      tip: "Go early",
    });
  });
});
```

- [ ] **Step 2: Run, verify it fails**

Run: `npx vitest run test/ai.test.ts`
Expected: FAIL ("pickItemFields is not exported").

- [ ] **Step 3: Implement in `src/lib/ai.ts`**

Add to the imports:

```ts
import type { Item, ItemTranslation, Lang, Stay, StayTranslation, DayTranslation } from "../types";
```

Append:

```ts
const TRANSLATE_MODEL = "gemini-2.5-flash";
const ITEM_FIELDS = ["title", "note", "place", "tag", "tip"] as const;

/** The activity's non-empty translatable fields, trimmed. */
export function pickItemFields(item: Item): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of ITEM_FIELDS) {
    const v = (item[f] ?? "").trim();
    if (v) out[f] = v;
  }
  return out;
}

/**
 * Translate a flat map of fields into every target language in one call.
 * Returns a map keyed by language code → { field: translation }. Resolves to
 * {} (no API call) when there are no fields or no target languages.
 */
async function translateFields(
  fields: Record<string, string>,
  langs: Lang[],
  context?: string,
): Promise<Record<string, Record<string, string>>> {
  const fieldKeys = Object.keys(fields);
  if (langs.length === 0 || fieldKeys.length === 0) return {};

  const [{ getGenerativeModel, Schema }, ai] = await Promise.all([
    import("firebase/ai"),
    getAiInstance(),
  ]);

  const perLang = Schema.object({
    properties: Object.fromEntries(fieldKeys.map((k) => [k, Schema.string()])),
  });
  const responseSchema = Schema.object({
    properties: Object.fromEntries(langs.map((l) => [l.code, perLang])),
  });

  const model = getGenerativeModel(ai, {
    model: TRANSLATE_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  const prompt =
    `Translate these travel itinerary fields into the target languages. ` +
    `${context ? `Context: ${context}. ` : ""}` +
    `Keep proper nouns natural for each language and keep wording concise and warm ` +
    `for an elderly traveller. Return JSON keyed by language code, each value an ` +
    `object using the same field keys.\n` +
    `Target languages: ${langs.map((l) => `${l.code} (${l.label})`).join(", ")}.\n` +
    `Fields:\n${JSON.stringify(fields, null, 2)}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim().replace(/^```json\s*|\s*```$/g, "");
  if (!text) return {};
  return JSON.parse(text) as Record<string, Record<string, string>>;
}

/** Translate an activity's fields into every target language. */
export async function translateItem(
  item: Item,
  langs: Lang[],
  dest: string,
): Promise<Record<string, ItemTranslation>> {
  return (await translateFields(pickItemFields(item), langs, dest)) as Record<
    string,
    ItemTranslation
  >;
}

/** Translate an accommodation's name + description into every target language. */
export async function translateStay(
  stay: Stay,
  langs: Lang[],
): Promise<Record<string, StayTranslation>> {
  const fields: Record<string, string> = {};
  if (stay.name?.trim()) fields.name = stay.name.trim();
  if (stay.desc?.trim()) fields.desc = stay.desc.trim();
  return (await translateFields(fields, langs)) as Record<string, StayTranslation>;
}

/** Translate a day theme into every target language. */
export async function translateDayTheme(
  theme: string,
  langs: Lang[],
): Promise<Record<string, DayTranslation>> {
  const t = theme.trim();
  if (!t) return {};
  return (await translateFields({ theme: t }, langs)) as Record<string, DayTranslation>;
}
```

- [ ] **Step 4: Run helper test + type-check**

Run: `npx vitest run test/ai.test.ts && npx tsc -b`
Expected: PASS. (If `Schema`/`generationConfig.responseSchema` types differ in the installed `firebase` version, consult Context7 for `firebase/ai` structured-output usage and adjust; the prompt already requests JSON so a `responseMimeType`-only fallback works.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai.ts test/ai.test.ts
git commit -m "feat: add Gemini translation functions"
```

---

## Task 8: Traveler wiring (view + picker)

**Files:**
- Modify: `src/lib/dayView.ts`, `src/components/traveler/DayScreen.tsx`, `src/components/traveler/TravelerApp.tsx`, `src/components/traveler/DetailsScreen.tsx`

- [ ] **Step 1: `buildViewItems` localizes entities**

Replace the body of `src/lib/dayView.ts`'s `buildViewItems`:

```ts
import { localizeItem } from "./localize";
// …
export function buildViewItems(day: Day, lang: string): ViewItem[] {
  const items = day.items ?? [];
  return items.map((raw, index) => {
    const item = localizeItem(raw, lang);
    return {
      item,
      index,
      title: item.title,
      place: item.place ?? "",
      thumb: imgFor(item),
      accent: ACC[item.kind],
      soft: SOFT[item.kind],
      tag: item.tag ?? "",
      isLast: index === items.length - 1,
    };
  });
}
```

(The old `useLocalLang`/dual-title behaviour is intentionally removed — see spec "Behavior change".)

- [ ] **Step 2: `DayScreen` takes a `lang` code**

In `src/components/traveler/DayScreen.tsx`: import `import { localizeStay, localizeDayTheme } from "../../lib/localize";`. Change the prop `useLocalLang: boolean;` → `lang: string;`, destructure `lang` instead of `useLocalLang`, and replace the stay/theme logic:

```ts
const viewItems = buildViewItems(day, lang);
// …
const rawStay = day.stay ?? trip.hotel;
const stay = rawStay ? localizeStay(rawStay, lang) : null;
const stayName = stay?.name ?? "";
const staySub = stay?.desc ?? stay?.note ?? "";
```

And use the localized theme in the header (line ~102): replace `{day.theme}` with `{localizeDayTheme(day, lang)}`.

- [ ] **Step 3: `TravelerApp` holds `prefLang` (any code) + persistence**

In `src/components/traveler/TravelerApp.tsx`, replace the `prefLang` state and `useLocalLang` derivation:

```ts
const [prefLang, setPrefLang] = useState<string>(() => {
  try {
    const stored = localStorage.getItem(`yl.lang.${trip.id}`);
    if (stored === "en" || (trip.languages ?? []).some((l) => l.code === stored)) {
      return stored as string;
    }
  } catch {
    /* ignore storage errors */
  }
  return "en";
});

const changeLang = (code: string) => {
  setPrefLang(code);
  try {
    localStorage.setItem(`yl.lang.${trip.id}`, code);
  } catch {
    /* ignore storage errors */
  }
};

// Reset to English if the chosen language is removed from the trip.
useEffect(() => {
  if (prefLang !== "en" && !(trip.languages ?? []).some((l) => l.code === prefLang)) {
    setPrefLang("en");
  }
}, [trip.languages, prefLang]);
```

Remove the `nl`/`useLocalLang` lines. Pass `lang={prefLang}` to `DayScreen` (instead of `useLocalLang`), pass `buildViewItems(currentDay, prefLang)` for `sheetItems`, and pass `setPrefLang={changeLang}` to `DetailsScreen`.

- [ ] **Step 4: `DetailsScreen` lists all languages + localizes hotel**

In `src/components/traveler/DetailsScreen.tsx`: import `localizeStay`. Replace the `nl`/`langOptions` block:

```ts
const languages = trip.languages ?? [];
const langOptions = [{ code: "en", label: "English" }, ...languages];
```

Change the language card guard from `{nl && (` to `{languages.length > 0 && (`. For the hotel section, localize: `const hotel = localizeStay(trip.hotel, prefLang);` and render `hotel.name` / `hotel.address` / `hotel.phone`.

- [ ] **Step 5: Verify build**

Run: `npx tsc -b && npm run lint`
Expected: PASS, no references to `useLocalLang`/`nativeLang` remain in these files.

- [ ] **Step 6: Commit**

```bash
git add src/lib/dayView.ts src/components/traveler/
git commit -m "feat(traveler): localize day view and support multiple languages"
```

---

## Task 9: Admin Settings — Languages card

**Files:**
- Modify: `src/components/admin/SettingsTab.tsx`

- [ ] **Step 1: Add the Languages card**

Import the helpers and presets:

```ts
import { addContact, addTripLanguage, removeTripLanguage, /* …existing… */ } from "../../lib/editTrip";
import { LANGUAGE_PRESETS } from "../../lib/languages";
```

Insert a new card (after the Visibility card, before Share link). It lists current languages as removable chips and a `<select>` of presets not yet added:

```tsx
{/* Languages */}
<div className={cn(ui.padCard, "mb-4")}>
  <Label>Languages</Label>
  <div className="mb-3 text-[13.5px] font-medium leading-[1.45] text-muted">
    English is always shown. Add languages travelers can switch to; activity and
    accommodation text can then be translated from the itinerary editor.
  </div>
  {(trip.languages ?? []).length > 0 && (
    <div className="mb-3 flex flex-wrap gap-2">
      {(trip.languages ?? []).map((l) => (
        <span
          key={l.code}
          className="flex items-center gap-2 rounded-pill bg-control px-[12px] py-[7px] text-[13.5px] font-bold text-ink-dim"
        >
          {l.label}
          <button
            onClick={() => update((t) => removeTripLanguage(t, l.code))}
            aria-label={`Remove ${l.label}`}
            className="flex h-[18px] w-[18px] cursor-pointer items-center justify-center rounded-full bg-[#e3dacb]"
          >
            <CloseIcon size={11} />
          </button>
        </span>
      ))}
    </div>
  )}
  <select
    value=""
    onChange={(e) => {
      const lang = LANGUAGE_PRESETS.find((l) => l.code === e.target.value);
      if (lang) update((t) => addTripLanguage(t, lang));
    }}
    className={cn(ui.input, "h-12 font-semibold")}
  >
    <option value="" disabled>
      Add a language…
    </option>
    {LANGUAGE_PRESETS.filter(
      (p) => !(trip.languages ?? []).some((l) => l.code === p.code),
    ).map((p) => (
      <option key={p.code} value={p.code}>
        {p.label}
      </option>
    ))}
  </select>
</div>
```

- [ ] **Step 2: Verify**

Run: `npx tsc -b && npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/SettingsTab.tsx
git commit -m "feat(admin): add languages card to settings"
```

---

## Task 10: Admin itinerary — Translate buttons + Ask AI chaining

**Files:**
- Modify: `src/components/admin/Editor.tsx`, `src/components/admin/DaysTab.tsx`

- [ ] **Step 1: Add translate handlers + Ask AI chaining in `Editor.tsx`**

Extend the **existing** import statements (do not add duplicate named imports —
`Editor.tsx` already imports `generateActivityDescription`/`generateActivityImage` from
`../../lib/ai` and `setItemContent` from `../../lib/editTrip`). Merge in the new names:

```ts
// from ../../lib/ai — add:
import { /* …existing… */ translateItem, translateStay, translateDayTheme } from "../../lib/ai";
// from ../../lib/editTrip — add:
import { /* …existing… */ setItemTranslations, setStayTranslations, setDayTranslations } from "../../lib/editTrip";
```

Add a translate-busy key state:

```ts
const [translateBusyKey, setTranslateBusyKey] = useState("");
```

Update `askAI` to chain translation after content generation (replace the `update(...)` line region):

```ts
const langs = trip.languages ?? [];
const base = { ...item, note, ...(image ? { image } : {}) };
let translations: Record<string, import("../../types").ItemTranslation> = {};
if (langs.length > 0) {
  try {
    translations = await translateItem(base, langs, dest);
  } catch {
    showToast("Saved description, but translation failed. Try Translate again.");
  }
}
update((t) => {
  let nextTrip = setItemContent(t, di, ii, image ? { note, image } : { note });
  if (Object.keys(translations).length > 0) {
    nextTrip = setItemTranslations(nextTrip, di, ii, translations);
  }
  return nextTrip;
});
```

Add three handlers:

```ts
const translateItemAt = async (di: number, ii: number) => {
  const langs = trip.languages ?? [];
  if (langs.length === 0) return;
  const key = `i-${di}-${ii}`;
  setTranslateBusyKey(key);
  try {
    const map = await translateItem(trip.days[di].items[ii], langs, `${trip.dest}, ${trip.country}`);
    update((t) => setItemTranslations(t, di, ii, map));
  } catch (e: unknown) {
    showToast(e instanceof Error ? e.message : "Translation failed.");
  } finally {
    setTranslateBusyKey("");
  }
};

const translateStayAt = async (di: number) => {
  const langs = trip.languages ?? [];
  const stay = trip.days[di].stay;
  if (langs.length === 0 || !stay) return;
  const key = `s-${di}`;
  setTranslateBusyKey(key);
  try {
    const map = await translateStay(stay, langs);
    update((t) => setStayTranslations(t, di, map));
  } catch (e: unknown) {
    showToast(e instanceof Error ? e.message : "Translation failed.");
  } finally {
    setTranslateBusyKey("");
  }
};

const translateDayAt = async (di: number) => {
  const langs = trip.languages ?? [];
  if (langs.length === 0) return;
  const key = `d-${di}`;
  setTranslateBusyKey(key);
  try {
    const map = await translateDayTheme(trip.days[di].theme, langs);
    update((t) => setDayTranslations(t, di, map));
  } catch (e: unknown) {
    showToast(e instanceof Error ? e.message : "Translation failed.");
  } finally {
    setTranslateBusyKey("");
  }
};
```

Pass new props to `DaysTab`:

```tsx
<DaysTab
  /* …existing… */
  hasLanguages={(trip.languages ?? []).length > 0}
  translateBusyKey={translateBusyKey}
  onTranslateItem={translateItemAt}
  onTranslateStay={translateStayAt}
  onTranslateDay={translateDayAt}
/>
```

- [ ] **Step 2: Add Translate controls in `DaysTab.tsx`**

Extend `DaysTabProps`:

```ts
  hasLanguages: boolean;
  translateBusyKey: string;
  onTranslateItem: (di: number, ii: number) => void;
  onTranslateStay: (di: number) => void;
  onTranslateDay: (di: number) => void;
```

Destructure them in the component signature. Then:

- **Day title** (after the theme input): when `hasLanguages`, add a translate button calling `onTranslateDay(di)`, disabled while `translateBusyKey === \`d-${di}\``.
- **Each activity card** (in the row with "Ask AI"): when `hasLanguages`, add a "Translate" button calling `onTranslateItem(di, ii)`, disabled while `translateBusyKey === \`i-${di}-${ii}\``.
- **Accommodation card** (after the stay inputs): when `hasLanguages` and a stay name exists, add a "Translate" button calling `onTranslateStay(di)`, disabled while `translateBusyKey === \`s-${di}\``.

Use the existing dark button styling from the Ask AI button (the `bg-ink … text-white` classes) with a `SparkleIcon` and label `Translate` / `Translating…`.

- [ ] **Step 3: Verify**

Run: `npx tsc -b && npm run lint`
Expected: PASS.

- [ ] **Step 4: Manual smoke check**

Run: `npm run dev`, open the admin editor, add a language in Settings, then in the itinerary use "Ask AI" and the Translate buttons; confirm translated text appears and persists, and that the traveler view language switcher shows the language.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/Editor.tsx src/components/admin/DaysTab.tsx
git commit -m "feat(admin): per-entity translate buttons and Ask AI translation"
```

---

## Task 11: Cleanup — drop legacy fields

**Files:**
- Modify: `src/types.ts`, `src/data/seedTrips.ts`, `src/data/chinaTrip.ts`, `test/editTrip.test.ts`

- [ ] **Step 1: Make `languages` required; remove deprecated fields from `types.ts`**

In `src/types.ts`: change `languages?: Lang[];` → `languages: Lang[];`, delete the `nativeLang?` line from `Trip`, delete `local?` from `Item`, and delete `localName?` from `Stay`.

- [ ] **Step 2: Rebase seed types on the migration input shape**

In both `src/data/seedTrips.ts` and `src/data/chinaTrip.ts`, change:

```ts
import type { /* … */ } from "../types";
export type SeedTrip = Omit<TripData, "ownerId">;
```
to:
```ts
import type { RawTripData } from "../lib/migrateTrip";
export type SeedTrip = Omit<RawTripData, "ownerId">;
```

This keeps the existing `nativeLang` / `local` / `localName` literals valid with no content edits.

- [ ] **Step 3: (No importer to update)**

`src/data/seedTrips.ts` and `src/data/chinaTrip.ts` are **data-only** with no importers in the repo (the old `importChinaTrip.ts` / `npm run seed` no longer exist). The Step 2 type rebase is sufficient to keep them compiling. Nothing to do here — if a seed importer is added later, it should call `normalizeTrip(...)` before writing so the persisted doc is in the new shape.

- [ ] **Step 4: Update the test fixture**

In `test/editTrip.test.ts`, ensure `fixture()` uses `languages: []` (remove any `nativeLang`).

- [ ] **Step 5: Drop now-unneeded `?? []` guards (optional tidy)**

Search for `trip.languages ?? []` / `(trip.languages ?? [])` added in Tasks 6–10 and simplify to `trip.languages` where the value is guaranteed present (skip anywhere a raw/legacy value could still flow in). Keep guards inside `migrateTrip.ts`.

- [ ] **Step 6: Full verification**

Run: `npx tsc -b && npm run lint && npm test`
Expected: PASS — build clean, lint clean, all unit + Firestore-rules tests green.

- [ ] **Step 7: Commit**

```bash
git add src/types.ts src/data/ test/editTrip.test.ts src/
git commit -m "refactor: remove legacy single-language fields"
```

---

## Final verification checklist

- [ ] `npx tsc -b` clean
- [ ] `npm run lint` clean
- [ ] `npm test` green (unit + rules)
- [ ] `npm run build` succeeds (PWA build)
- [ ] Manual: add 2 languages → Ask AI on an activity fills all → traveler switcher shows all → reload keeps language → removing a language drops its chips and translations.
