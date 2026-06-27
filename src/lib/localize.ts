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
