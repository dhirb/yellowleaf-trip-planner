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
