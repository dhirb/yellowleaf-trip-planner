import type { Lang, Trip } from "../types";
import { translateField } from "./ai";

/**
 * Build the per-field translation handlers shared by the item and stay edit
 * screens. The only thing that differs between them is which entity the
 * translation map lands on, so the caller supplies a `commit` adapter (wrapping
 * the matching `set*Translations` helper) and this owns the shared shaping.
 *
 * - `setTrans(field)(code, value)` persists one hand-edited translation.
 * - `translateInto(field, value)()` fills every language for one field via AI.
 */
/**
 * Shape a flat `code → translated value` map (what {@link translateField}
 * returns) into the per-language single-field override map that the
 * `set*Translations` edit helpers expect.
 */
export function fieldTranslationMap<TTrans>(
  field: string,
  map: Record<string, string>,
): Record<string, TTrans> {
  return Object.fromEntries(
    Object.entries(map).map(([code, v]) => [code, { [field]: v } as TTrans]),
  );
}

export function makeTranslationHandlers<TTrans>(
  update: (updater: (t: Trip) => Trip) => void,
  commit: (t: Trip, map: Record<string, TTrans>) => Trip,
  langs: Lang[],
  dest?: string,
): {
  setTrans: (field: string) => (code: string, value: string) => void;
  translateInto: (field: string, value: string) => () => Promise<void>;
} {
  const setTrans = (field: string) => (code: string, value: string) =>
    update((t) => commit(t, { [code]: { [field]: value } as TTrans }));

  const translateInto = (field: string, value: string) => async () => {
    const map = await translateField(field, value, langs, dest);
    update((t) => commit(t, fieldTranslationMap<TTrans>(field, map)));
  };

  return { setTrans, translateInto };
}
