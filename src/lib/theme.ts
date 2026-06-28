/**
 * Colour-theme preference. `auto` follows the OS via prefers-color-scheme; the
 * other two pin the theme. The stored value is the `Theme` literal, but what we
 * actually apply to the document is the *resolved* `light | dark`. Kept
 * framework-free so it can be unit-tested in node.
 */
export type Theme = "auto" | "light" | "dark";

export type ResolvedTheme = "light" | "dark";

export const THEMES: readonly Theme[] = ["auto", "light", "dark"];

export const THEME_LABELS: Record<Theme, string> = {
  auto: "System",
  light: "Light",
  dark: "Dark",
};

export function isTheme(value: unknown): value is Theme {
  return (
    typeof value === "string" && (THEMES as readonly string[]).includes(value)
  );
}

/** Collapse the stored preference into the theme actually applied. */
export function resolveTheme(
  theme: Theme,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (theme === "auto") return systemPrefersDark ? "dark" : "light";
  return theme;
}
