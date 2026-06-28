# Traveler Font Size Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-device "Text size" control (Standard / Large / X-Large) to the traveler view that scales only text, with automated layout validation that larger sizes don't break layout.

**Architecture:** A single CSS variable `--font-scale` (set on `document.documentElement` by a `useFontScale` hook) multiplies every traveler font size. The ~71 ad-hoc `text-[Npx]` utilities are consolidated into 8 semantic type tokens in `tokens.css`, each defined as `calc(<px> * var(--font-scale, 1))`. The `, 1` fallback keeps the admin view (which never references these tokens) at 1× untouched. A Playwright harness mounts the real `TravelerApp` with seed data and asserts no horizontal overflow at each scale.

**Tech Stack:** React 19 + TypeScript, Tailwind CSS v4 (`@theme` in `src/styles/tokens.css`), Vitest (node env, pure-logic tests), Playwright (new, for layout validation).

**Spec:** `docs/superpowers/specs/2026-06-28-traveler-font-size-control-design.md`

---

## Reference: size → token mapping

This mapping is used in Task 1 (token definitions) and Task 5 (sweep). All 19 distinct sizes are covered.

| Token | Base px | Replaces `text-[Npx]` |
|---|---|---|
| `text-tag` | 12 | 11.5, 12 |
| `text-caption` | 13 | 12.5, 13, 13.5 |
| `text-small` | 14 | 14, 14.5 |
| `text-body` | 15 | 15, 15.5, 16 |
| `text-lead` | 17 | 17, 18 |
| `text-subtitle` | 19 | 18.5, 19, 20 |
| `text-title` | 22 | 22 |
| `text-display` | 27 | 26, 27, 30 |

> **Naming note:** the spec used `text-sm`; this plan renames it to `text-small` to avoid shadowing Tailwind's built-in `text-sm`. (Verified: no standard `text-xs/sm/base/lg/xl/*` utilities are used anywhere in `src/`, so there is no collision either way — `text-small` is purely defensive.)

---

## Task 1: Define the scale-aware semantic type scale

**Files:**
- Modify: `src/styles/tokens.css` (inside the `@theme` block, after the `── Type ──` section near line 58)

- [ ] **Step 1: Add the type tokens**

In `src/styles/tokens.css`, inside `@theme { ... }`, just below the existing `--font-sans` line, add:

```css
  /* ── Type scale (traveler) ──
   * Each size scales with --font-scale (set per-device by useFontScale).
   * The `, 1` fallback keeps any surface that doesn't set the variable
   * (the admin view) at exactly 1×. Only font-size reads this — padding,
   * gaps, icons and radii stay fixed, so scaling is text-only. */
  --text-tag: calc(12px * var(--font-scale, 1));
  --text-caption: calc(13px * var(--font-scale, 1));
  --text-small: calc(14px * var(--font-scale, 1));
  --text-body: calc(15px * var(--font-scale, 1));
  --text-lead: calc(17px * var(--font-scale, 1));
  --text-subtitle: calc(19px * var(--font-scale, 1));
  --text-title: calc(22px * var(--font-scale, 1));
  --text-display: calc(27px * var(--font-scale, 1));
```

- [ ] **Step 2: Verify Tailwind generates scale-aware utilities**

Tailwind v4 generates a `text-<name>` utility for each `--text-<name>` and references it via `var()`. Because no paired `--text-*--line-height` is defined, each utility sets **only** `font-size`. Confirm the build emits the calc:

Run:
```bash
npm run build && grep -o 'calc(15px \* var(--font-scale[^)]*))' dist/assets/*.css | head -1
```
Expected: prints `calc(15px * var(--font-scale, 1))` (proves `text-body` resolves at runtime, not inlined to a static px). If it prints nothing, the token namespace needs adjustment — fall back to a `--fs-*` namespace plus `@utility text-body { font-size: var(--fs-body); }` declarations and re-verify before proceeding.

- [ ] **Step 3: Commit**

```bash
git add src/styles/tokens.css
git commit -m "feat(traveler): add scale-aware semantic type scale tokens"
```

---

## Task 2: Pure font-scale logic + tests

Extracting the pure logic (step names, scale mapping, validation) into `src/lib/` lets us unit-test it in the existing node Vitest env (no jsdom needed), matching how the repo already tests logic but keeps hooks thin.

**Files:**
- Create: `src/lib/fontScale.ts`
- Test: `test/fontScale.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/fontScale.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  FONT_STEPS,
  FONT_STEP_LABELS,
  isFontStep,
  scaleFor,
  type FontStep,
} from "../src/lib/fontScale";

describe("fontScale", () => {
  it("exposes the three steps in order", () => {
    expect(FONT_STEPS).toEqual(["standard", "large", "xlarge"]);
  });

  it("maps each step to the correct numeric scale", () => {
    expect(scaleFor("standard")).toBe(1);
    expect(scaleFor("large")).toBe(1.15);
    expect(scaleFor("xlarge")).toBe(1.3);
  });

  it("has a human label for every step", () => {
    for (const step of FONT_STEPS) {
      expect(FONT_STEP_LABELS[step as FontStep]).toBeTruthy();
    }
  });

  it("accepts valid step strings", () => {
    expect(isFontStep("standard")).toBe(true);
    expect(isFontStep("xlarge")).toBe(true);
  });

  it("rejects invalid or non-string values", () => {
    expect(isFontStep("huge")).toBe(false);
    expect(isFontStep("")).toBe(false);
    expect(isFontStep(null)).toBe(false);
    expect(isFontStep(2)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/fontScale.test.ts`
Expected: FAIL — cannot resolve `../src/lib/fontScale`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/fontScale.ts`:

```ts
/**
 * Traveler text-size preference. A small fixed scale that only ever grows from
 * the baseline, exposed as a multiplier the CSS type tokens read via
 * `var(--font-scale)`. Kept framework-free so it can be unit-tested in node.
 */
export type FontStep = "standard" | "large" | "xlarge";

export const FONT_STEPS: readonly FontStep[] = [
  "standard",
  "large",
  "xlarge",
];

const FONT_SCALE: Record<FontStep, number> = {
  standard: 1,
  large: 1.15,
  xlarge: 1.3,
};

export const FONT_STEP_LABELS: Record<FontStep, string> = {
  standard: "Standard",
  large: "Large",
  xlarge: "X-Large",
};

export function isFontStep(value: unknown): value is FontStep {
  return typeof value === "string" && value in FONT_SCALE;
}

export function scaleFor(step: FontStep): number {
  return FONT_SCALE[step];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/fontScale.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/fontScale.ts test/fontScale.test.ts
git commit -m "feat: add font-scale steps and scale mapping with tests"
```

---

## Task 3: useFontScale hook

Thin hook mirroring `src/hooks/useTimeFormat.ts`: reads/persists the step in localStorage and applies `--font-scale` to the document root as a side effect.

**Files:**
- Create: `src/hooks/useFontScale.ts`

- [ ] **Step 1: Implement the hook**

Create `src/hooks/useFontScale.ts`:

```ts
import { useCallback, useEffect, useState } from "react";
import { type FontStep, isFontStep, scaleFor } from "../lib/fontScale";

const STORAGE_KEY = "yl:fontScale";
const DEFAULT: FontStep = "standard";

function read(): FontStep {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isFontStep(v) ? v : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

/**
 * The traveler's text-size preference, persisted per-device in localStorage so
 * it sticks across visits and applies to every trip. On change it writes
 * `--font-scale` to the document root; the type tokens in tokens.css multiply
 * their base px by it, so all traveler text resizes together. The admin view
 * never references those tokens, so it is unaffected (fallback resolves to 1).
 */
export function useFontScale(): {
  fontScale: FontStep;
  setFontScale: (step: FontStep) => void;
} {
  const [fontScale, setFontScale] = useState<FontStep>(read);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, fontScale);
    } catch {
      // Private mode / storage disabled — fall back to in-memory state only.
    }
    document.documentElement.style.setProperty(
      "--font-scale",
      String(scaleFor(fontScale)),
    );
  }, [fontScale]);

  const set = useCallback((step: FontStep) => setFontScale(step), []);

  return { fontScale, setFontScale: set };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useFontScale.ts
git commit -m "feat(traveler): add useFontScale hook applying --font-scale"
```

---

## Task 4: Wire the control into Settings

Add the "Text size" card to `SettingsScreen` (built with the new tokens from the start) and thread the hook through `TravelerApp`, exactly like `timeFormat`.

**Files:**
- Modify: `src/components/traveler/SettingsScreen.tsx`
- Modify: `src/components/traveler/TravelerApp.tsx`

- [ ] **Step 1: Extend SettingsScreen props and render the card**

In `src/components/traveler/SettingsScreen.tsx`:

Add imports near the top:
```ts
import { FONT_STEPS, FONT_STEP_LABELS, type FontStep } from "../../lib/fontScale";
```

Extend the props interface:
```ts
interface SettingsScreenProps {
  trip: Trip;
  prefLang: string;
  setPrefLang: (code: string) => void;
  timeFormat: TimeFormat;
  setTimeFormat: (fmt: TimeFormat) => void;
  fontScale: FontStep;
  setFontScale: (step: FontStep) => void;
}
```

Destructure the two new props in the function signature alongside the others.

Immediately **after** the Time-format card's closing `</div>` (the block that renders `TIME_OPTIONS`), add the Text-size card:
```tsx
        {/* Text size */}
        <div className={cn(ui.padCard, "mb-4")}>
          <Label>Text size</Label>
          <div className="flex gap-[7px]">
            {FONT_STEPS.map((step) => (
              <button
                key={step}
                onClick={() => setFontScale(step)}
                className={cn(
                  "flex-1 cursor-pointer rounded-[12px] px-0 py-3 text-center text-body font-bold",
                  fontScale === step
                    ? "bg-accent text-white"
                    : "bg-control text-ink-dim",
                )}
              >
                {FONT_STEP_LABELS[step]}
              </button>
            ))}
          </div>
          <div className="mt-[10px] text-caption font-semibold leading-[1.4] text-faint">
            Makes all text larger for easier reading.
          </div>
        </div>
```

> Note: this new card already uses the tokens (`text-body`, `text-caption`). The rest of this file's `text-[Npx]` literals are converted in Task 5.

- [ ] **Step 2: Thread the hook through TravelerApp**

In `src/components/traveler/TravelerApp.tsx`:

Add the import:
```ts
import { useFontScale } from "../../hooks/useFontScale";
```

Just after the existing `const { timeFormat, setTimeFormat } = useTimeFormat();` line, add:
```ts
  const { fontScale, setFontScale } = useFontScale();
```

Pass the new props to `<SettingsScreen ... />`:
```tsx
        <SettingsScreen
          trip={trip}
          prefLang={prefLang}
          setPrefLang={changeLang}
          timeFormat={timeFormat}
          setTimeFormat={setTimeFormat}
          fontScale={fontScale}
          setFontScale={setFontScale}
        />
```

- [ ] **Step 3: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors; build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/traveler/SettingsScreen.tsx src/components/traveler/TravelerApp.tsx
git commit -m "feat(traveler): add Text size control to Settings"
```

---

## Task 5: Convert traveler font sizes to the type scale

Mechanically replace every `text-[Npx]` in `src/components/traveler/` with its token (per the mapping table). 15 files, ~71 occurrences.

**Files (all in `src/components/traveler/`):** ActivityCard, DayItems, DayStrip, DayView, DetailScreen, DetailShell, FlightCard, FlightDetailScreen, HelpScreen, InstallPrompt, SettingsScreen, StayCard, StayDetailScreen, TabBar, TravelerRoute.

- [ ] **Step 1: Run the replacement script**

Each `text-[Npx]` literal is unique (e.g. `text-[12px]` cannot match inside `text-[12.5px]`), so order-independent literal replacement is safe.

Run:
```bash
cd src/components/traveler
perl -pi -e '
  s/\Qtext-[11.5px]\E/text-tag/g;
  s/\Qtext-[12px]\E/text-tag/g;
  s/\Qtext-[12.5px]\E/text-caption/g;
  s/\Qtext-[13px]\E/text-caption/g;
  s/\Qtext-[13.5px]\E/text-caption/g;
  s/\Qtext-[14px]\E/text-small/g;
  s/\Qtext-[14.5px]\E/text-small/g;
  s/\Qtext-[15px]\E/text-body/g;
  s/\Qtext-[15.5px]\E/text-body/g;
  s/\Qtext-[16px]\E/text-body/g;
  s/\Qtext-[17px]\E/text-lead/g;
  s/\Qtext-[18px]\E/text-lead/g;
  s/\Qtext-[18.5px]\E/text-subtitle/g;
  s/\Qtext-[19px]\E/text-subtitle/g;
  s/\Qtext-[20px]\E/text-subtitle/g;
  s/\Qtext-[22px]\E/text-title/g;
  s/\Qtext-[26px]\E/text-display/g;
  s/\Qtext-[27px]\E/text-display/g;
  s/\Qtext-[30px]\E/text-display/g;
' *.tsx
cd -
```

- [ ] **Step 2: Verify no px font sizes remain**

Run:
```bash
grep -rn 'text-\[[0-9.]*px\]' src/components/traveler/ && echo "REMAINING ABOVE" || echo "CLEAN"
```
Expected: `CLEAN`.

- [ ] **Step 3: Verify no px line-heights were introduced (regression guard)**

Run:
```bash
grep -rn 'leading-\[[0-9.]*px\]' src/components/traveler/ && echo "FIX THESE (convert to unitless, e.g. leading-[1.4])" || echo "OK: no px line-heights"
```
Expected: `OK: no px line-heights`. (A fixed px line-height would not grow with the font and would clip at large scales.)

- [ ] **Step 4: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors; build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/traveler/
git commit -m "refactor(traveler): replace ad-hoc px font sizes with type scale tokens"
```

---

## Task 6: Playwright layout-validation harness

A static-served harness mounts the **real** `TravelerApp` with seed data so the validation exercises real components + the real `tokens.css`, without Firestore/auth. The Playwright test sets `--font-scale` to each value and asserts no element overflows the 440px viewport horizontally, then saves screenshots as artifacts.

**Files:**
- Modify: `package.json` (devDependency + scripts)
- Create: `playwright.config.ts`
- Create: `harness.html` (repo root — Vite serves root-level HTML in dev)
- Create: `test/harness/main.tsx`
- Create: `test/e2e/font-scale.spec.ts`

- [ ] **Step 1: Install Playwright**

Run:
```bash
npm install -D @playwright/test && npx playwright install chromium webkit
```

- [ ] **Step 2: Add scripts to package.json**

Add to the `"scripts"` block:
```json
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
```

- [ ] **Step 3: Create the harness entry**

Create `harness.html` at the repo root:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Font scale harness</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/test/harness/main.tsx"></script>
  </body>
</html>
```

Create `test/harness/main.tsx`.

> **Critical:** `chinaTrip` is exported as raw `SeedTrip` data (`Omit<RawTripData, "ownerId">`), **not** a normalized `Trip`. `TravelerApp` requires a fully-migrated `Trip`, so the harness must run the seed through `normalizeTrip()` and attach an `id` — exactly what the real Firestore loader does (`src/lib/trips.ts` `toTrip()`: `{ ...normalizeTrip(data), id, ... }`). Passing the raw object would fail `tsc` and break rendering (`buildViewItems`/`localizeStay` expect normalized data), so every Playwright assertion would fail. The `chinaTrip` itinerary already includes days with activities, flights, and a stay, so all detail screens are reachable.

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../../src/styles/global.css";
import type { Trip } from "../../src/types";
import { normalizeTrip } from "../../src/lib/migrateTrip";
import { AppShell } from "../../src/components/AppShell";
import { TravelerApp } from "../../src/components/traveler/TravelerApp";
import { chinaTrip } from "../../src/data/chinaTrip";

// Mirror src/lib/trips.ts toTrip(): normalize raw seed data, then attach an id.
const trip: Trip = {
  ...normalizeTrip({ ...chinaTrip, ownerId: "demo" }),
  id: "demo",
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppShell>
      <TravelerApp trip={trip} />
    </AppShell>
  </StrictMode>,
);
```

> If `tsc` reports a missing field on the `Trip` object, compare against `toTrip()` in `src/lib/trips.ts` and add the same optional fields (`createdAt`/`updatedAt`/`deletedAt`) — they are not required for rendering.

- [ ] **Step 4: Create the Playwright config**

Create `playwright.config.ts`:
```ts
import { defineConfig, devices } from "@playwright/test";

const HARNESS_URL = "http://localhost:5173/harness.html";

export default defineConfig({
  testDir: "./test/e2e",
  fullyParallel: true,
  reporter: [["list"]],
  outputDir: "./test-results",
  use: {
    baseURL: HARNESS_URL,
    viewport: { width: 440, height: 900 },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 440, height: 900 } } },
    { name: "webkit", use: { ...devices["Desktop Safari"], viewport: { width: 440, height: 900 } } },
  ],
  webServer: {
    command: "npm run dev",
    url: HARNESS_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

> If `npm run dev` does not exist, use the actual dev command (check `package.json` — likely `vite`). The `url` must be reachable once the server is up.

- [ ] **Step 5: Write the validation test**

Create `test/e2e/font-scale.spec.ts`:
```ts
import { test, expect, type Page } from "@playwright/test";

const SCALES = [
  { step: "standard", value: 1 },
  { step: "large", value: 1.15 },
  { step: "xlarge", value: 1.3 },
] as const;

/** Apply a scale the way the app does, before any component mounts. */
async function gotoAtScale(page: Page, value: number) {
  await page.addInitScript((v) => {
    document.documentElement.style.setProperty("--font-scale", String(v));
  }, value);
  await page.goto("/harness.html");
  await expect(page.locator("#app-viewport")).toBeVisible();
}

/** Assert nothing overflows the fixed-width viewport horizontally. */
async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.getElementById("app-viewport")!;
    // Any descendant whose right edge exceeds the viewport's content box.
    const max = root.clientWidth;
    const bad: string[] = [];
    root.querySelectorAll<HTMLElement>("*").forEach((el) => {
      if (el.scrollWidth > el.clientWidth + 1) {
        bad.push(`${el.tagName}.${el.className}`.slice(0, 80));
      }
    });
    return { rootScroll: root.scrollWidth, rootClient: max, offenders: bad.slice(0, 10) };
  });
  expect(overflow.rootScroll, JSON.stringify(overflow)).toBeLessThanOrEqual(
    overflow.rootClient + 1,
  );
  expect(overflow.offenders, JSON.stringify(overflow.offenders)).toEqual([]);
}

for (const { step, value } of SCALES) {
  test(`day screen has no layout overflow at ${step}`, async ({ page }) => {
    await gotoAtScale(page, value);
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: `test-results/day-${step}.png`, fullPage: true });
  });

  test(`settings + help screens have no overflow at ${step}`, async ({ page }) => {
    await gotoAtScale(page, value);
    // Tab bar buttons are labelled; adjust selectors to the real TabBar markup.
    await page.getByRole("button", { name: /settings/i }).click();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: `test-results/settings-${step}.png`, fullPage: true });
    await page.getByRole("button", { name: /help/i }).click();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: `test-results/help-${step}.png`, fullPage: true });
  });

  test(`detail screens have no overflow at ${step}`, async ({ page }) => {
    await gotoAtScale(page, value);
    // Open the first activity/flight/stay card. Adjust selectors to real markup;
    // assert overflow on each detail screen, returning between each.
    const firstCard = page.locator("[data-testid='day-card'], button").first();
    await firstCard.click();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: `test-results/detail-${step}.png`, fullPage: true });
  });
}
```

> The TabBar/card selectors above are illustrative. During implementation, open `TabBar.tsx`, `DayItems.tsx`, `ActivityCard.tsx`, `FlightCard.tsx`, `StayCard.tsx` and use real accessible names or add a minimal `data-testid` where no stable selector exists. Keep added test hooks minimal.

- [ ] **Step 6: Run the validation**

Run: `npm run test:e2e`
Expected: all tests PASS for chromium and webkit across all three scales. If a test fails, the offender list in the error message names the overflowing element(s) — fix the underlying component (e.g. allow wrapping, `min-w-0` on flex children, truncate) and re-run. Inspect `test-results/*.png` to confirm the screens look right at each scale.

- [ ] **Step 7: Ignore artifacts**

Add to `.gitignore`:
```
/test-results/
/playwright-report/
```

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json playwright.config.ts harness.html test/harness/ test/e2e/ .gitignore
git commit -m "test(traveler): add Playwright font-scale layout validation harness"
```

---

## Task 7: Final verification

- [ ] **Step 1: Full unit suite**

Run: `npm test`
Expected: all Vitest suites pass (includes `fontScale.test.ts`).

- [ ] **Step 2: Type-check + build**

Run: `npx tsc --noEmit && npm run build`
Expected: clean.

- [ ] **Step 3: Layout validation**

Run: `npm run test:e2e`
Expected: green across all scales/browsers.

- [ ] **Step 4: Manual smoke (optional but recommended)**

Use the run skill (or `npm run dev`) to open the traveler view, change Text size in Settings, and confirm text grows while spacing/icons stay put and the choice persists across reload.

- [ ] **Step 5: Final commit (if any fixes were needed)**

```bash
git add -A && git commit -m "fix(traveler): resolve layout issues found by font-scale validation"
```

---

## Notes & risks

- **Tailwind token resolution (Task 1 Step 2) is the linchpin.** If the build inlines static px instead of emitting the `calc(... var(--font-scale) ...)`, switch to the `--fs-*` + `@utility` fallback before the sweep in Task 5.
- **Detail screens are covered automatically** because `useFontScale` sets the variable on `document.documentElement`, not on a wrapper — so even the early-`return` detail screens in `TravelerApp` scale.
- **Admin view is untouched:** it never uses the new tokens, and the `, 1` fallback means the variable being absent resolves to 1×.
- **Loading/error states in `TravelerRoute`** render before `TravelerApp` mounts the hook, so they display at 1× regardless of preference. Acceptable; tokenizing them (Task 5) is harmless.
