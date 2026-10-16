import type {
  DayTranslation,
  ItemTranslation,
  Lang,
  StayTranslation,
} from "../../types";

/** The one extra language this trip carries; English stays the base. */
export const ZH_HANS: Lang = { code: "zh-Hans", label: "简体中文" };

type Translation = ItemTranslation | StayTranslation | DayTranslation;

/** Wrap a Simplified Chinese override set as a `t` map keyed by language. */
export function zh<T extends Translation>(t: T): Record<string, T> {
  return { [ZH_HANS.code]: t };
}
