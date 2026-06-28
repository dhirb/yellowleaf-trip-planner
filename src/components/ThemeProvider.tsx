import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { isTheme, resolveTheme, type Theme } from "../lib/theme";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { ThemeContext } from "../hooks/useTheme";

const STORAGE_KEY = "yl:theme";
const DEFAULT: Theme = "auto";
const DARK_QUERY = "(prefers-color-scheme: dark)";

const parse = (raw: string | null): Theme | null => (isTheme(raw) ? raw : null);

const prefersDark = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia(DARK_QUERY).matches;

/**
 * Holds the colour-theme preference for the whole app. Mounted once at the
 * persistent app root (it survives admin↔traveler navigation), so unlike
 * useFontScale there is no per-view unmount cleanup — `data-theme` is global
 * and must stick across both surfaces. The resolved theme is written to
 * <html data-theme> before paint, and the token overrides in tokens.css do the
 * rest. When the preference is `auto`, the OS media query drives it live.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorage<Theme>(STORAGE_KEY, DEFAULT, parse);
  const [systemDark, setSystemDark] = useState<boolean>(prefersDark);

  // Track the OS preference so `auto` flips live when the user changes it.
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(DARK_QUERY);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const resolved = resolveTheme(theme, systemDark);

  // Reflect the resolved theme into the DOM before the browser paints, so
  // returning users never see a colour flip. No cleanup: this is the single,
  // global source of truth and the provider only unmounts on full teardown.
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}
