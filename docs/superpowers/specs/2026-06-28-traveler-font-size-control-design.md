# Traveler Font Size Control — Design

**Date:** 2026-06-28
**Status:** Approved (design), pending spec review

## Goal

Add a control to the traveler view that lets a traveler increase the size of
**text** for easier reading, without introducing layout issues (overflow,
clipping, broken cards). Scaling is text-only: padding, gaps, icon sizes, and
radii stay fixed.

## Constraints discovered

- The traveler UI uses **~71 hardcoded pixel font sizes** (`text-[15px]`,
  `text-[27px]`, …) across **15 files** in `src/components/traveler/`, with
  **~19 distinct sizes** and **zero `rem`**. A root `font-size` change would
  therefore not affect any traveler text.
- The whole app renders inside a single container (`#app-viewport`, a
  `max-w-[440px]` flex column in `src/components/AppShell.tsx`).
- An existing per-device preference pattern exists to mirror: the `useTimeFormat`
  hook (`src/hooks/useTimeFormat.ts`) + a pill-group card in
  `src/components/traveler/SettingsScreen.tsx`.
- Design tokens are defined via Tailwind v4 `@theme` in `src/styles/tokens.css`.

## Decisions (from brainstorming)

- **Scope:** text-only scaling (not whole-UI zoom).
- **Implementation:** consolidate the ad-hoc sizes into a small **semantic type
  scale**, each token scale-aware.
- **Presets:** 3 steps — Standard / Large / X-Large (`1.0 / 1.15 / 1.3`). Only
  grows from the current baseline (accessibility-focused).
- **Persistence:** per-device, global (one localStorage key for all trips), via a
  new `useFontScale` hook.

## Architecture & mechanism

A single CSS variable, `--font-scale`, drives all traveler text. Each font size
becomes `calc(<px> * var(--font-scale, 1))`.

- The `, 1` fallback is load-bearing: anything that does not opt into the type
  tokens (the entire admin view, and any third-party text) is completely
  unaffected, because the variable resolves to `1` there. No scoping wrapper or
  unmount reset is needed.
- `--font-scale` is set on `document.documentElement` as a side effect of the
  `useFontScale` hook (same effect-based pattern as the localStorage write in
  `useTimeFormat`). Setting it at the document root guarantees coverage of **all**
  traveler screens, including the detail/flight/stay screens that `TravelerApp`
  `return`s early — before its main container is rendered.
- Only **font-size** reads the variable. Padding, gaps, icon sizes, and radii
  stay fixed → genuinely text-only scaling.

**Why not `rem` + root `font-size`:** changing the root `font-size` would also
scale every `rem`-based Tailwind spacing utility (`py-3`, `gap-2`) while leaving
arbitrary `px` paddings (`px-[18px]`) untouched — producing inconsistent, broken
layouts. A dedicated variable that only font-size reads keeps the blast radius
surgical and avoids `em` compounding bugs.

## The semantic type scale

Replace the ~19 ad-hoc sizes with 8 named tokens in `tokens.css`, each defined as
a scale-aware `calc()`:

| Token | Base px | Replaces (current px) |
|---|---|---|
| `text-tag` | 12px | 11.5, 12 |
| `text-caption` | 13px | 12.5, 13, 13.5 |
| `text-sm` | 14px | 14, 14.5 |
| `text-body` | 15px | 15, 15.5, 16 |
| `text-lead` | 17px | 17, 18 |
| `text-subtitle` | 19px | 18.5, 19, 20 |
| `text-title` | 22px | 22 |
| `text-display` | 27px | 26, 27, 30 |

Bucketing shifts some text by ≤1px at scale 1.0 (accepted). Each token is defined
like:

```css
--text-body: calc(15px * var(--font-scale, 1));
```

If Tailwind v4's reserved `--text-*` namespace (which auto-pairs a line-height)
interferes, fall back to a `--fs-*` namespace plus matching utilities. Behavior
is identical either way; this is an implementation detail to confirm during
build.

## Preference + control

### `useFontScale` hook (`src/hooks/useFontScale.ts`)

- `STORAGE_KEY = "yl:fontScale"`.
- Value is a step name: `"standard" | "large" | "xlarge"`.
- Mapping: `standard → 1`, `large → 1.15`, `xlarge → 1.3`.
- Reads/persists via `localStorage` with try/catch (mirrors `useTimeFormat`).
- On change (and on mount), writes the numeric scale to
  `document.documentElement.style` as `--font-scale`.
- Default: `"standard"`.
- Returns `{ fontScale, setFontScale }` where `fontScale` is the step name.

### Settings card

- A new "Text size" pill group in `SettingsScreen`, identical in shape to the
  existing Time-format card: 3 pills + a helper line
  (e.g. *"Makes all text larger for easier reading."*).
- Wired through `TravelerApp` exactly like `timeFormat` (hook instantiated in
  `TravelerApp`, value + setter passed to `SettingsScreen`).
- The control's own labels use the type tokens, so they scale consistently.

## Data flow

1. `TravelerApp` calls `useFontScale()` (alongside `useTimeFormat()`).
2. Hook reads `localStorage["yl:fontScale"]` → step (default `"standard"`).
3. Effect: persists the step and sets `--font-scale` on `documentElement` to the
   mapped numeric value.
4. All traveler components reference type-scale utilities (`text-body`, …), whose
   `calc()` reads `--font-scale` → text re-renders at the chosen scale.
5. `SettingsScreen` renders the pill group bound to `setFontScale`.

## Error handling

- Invalid or absent localStorage value → `"standard"`.
- All storage access wrapped in try/catch (private mode / disabled storage safe).
- The hook never throws; worst case the preference is in-memory for the session
  only.

## Testing & layout validation

Two layers:

### 1. Unit — `test/useFontScale.test.ts`

- Default is `"standard"` when storage is empty.
- Reads a valid stored value.
- Invalid stored value falls back to `"standard"`.
- Persists on change.
- Each step maps to the correct numeric scale (`1 / 1.15 / 1.3`).

### 2. Layout validation (Playwright)

For **each** scale (`1.0 / 1.15 / 1.3`) across the representative screens — day
list, item detail, flight detail, stay detail, settings, help — assert:

- **No horizontal overflow:** `scrollWidth <= clientWidth` on the 440px viewport.
- **No clipped text:** no element with hidden overflow whose `scrollHeight >
  clientHeight` in a way that truncates content.
- **Screenshots** captured at each scale for visual diff.

### Line-height pre-check

During implementation, grep for **px line-heights** (`leading-[Npx]`). A fixed
px line-height does not grow with the font and would clip ascenders/descenders at
larger scales. Any found are converted to unitless line-heights so they scale
with the text. (Current count in `src/components/traveler/` is **zero**, so this
is a defensive guard against regressions rather than a known fix.)

## Out of scope (YAGNI)

- A "small/denser" step below standard.
- Per-trip font size.
- Scaling icons, spacing, or the whole UI (zoom).
- Applying the type scale to the admin view.

## Files affected

- New: `src/hooks/useFontScale.ts`, `test/useFontScale.test.ts`, Playwright
  layout-validation test.
- Modified: `src/styles/tokens.css` (type tokens), all ~15 traveler components
  (swap px sizes → tokens), `src/components/traveler/SettingsScreen.tsx`
  (control), `src/components/traveler/TravelerApp.tsx` (wire hook).
