import { createContext, useContext } from "react";
import type { ResolvedTheme, Theme } from "../lib/theme";

export interface ThemeContextValue {
  /** The stored preference (`auto` follows the OS). */
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** The theme actually applied to the document (`auto` collapsed). */
  resolved: ResolvedTheme;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
