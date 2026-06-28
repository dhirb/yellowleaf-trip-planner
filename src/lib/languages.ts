import type { Lang } from "../types";

/** Curated languages an admin can add to a trip. English is always the base. */
export const LANGUAGE_PRESETS: Lang[] = [
  { code: "ja", label: "日本語" },
  { code: "zh-Hans", label: "简体中文" },
  { code: "zh-Hant", label: "繁體中文" },
  { code: "ko", label: "한국어" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
];
