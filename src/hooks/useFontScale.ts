import { useLayoutEffect } from "react";
import { type FontStep, isFontStep, scaleFor } from "../lib/fontScale";
import { useLocalStorage } from "./useLocalStorage";

const STORAGE_KEY = "yl:fontScale";
const DEFAULT: FontStep = "standard";

const parse = (raw: string | null): FontStep | null =>
  isFontStep(raw) ? raw : null;

/**
 * The traveler's text-size preference, persisted per-device in localStorage so
 * it sticks across visits and applies to every trip. On change it writes
 * `--font-scale` to the document root; the type tokens in tokens.css multiply
 * their base px by it, so all traveler text resizes together. The admin day
 * view reuses some traveler card components, so it would inherit this variable
 * — the cleanup below removes it on traveler unmount so admin falls back to 1×.
 */
export function useFontScale(): {
  fontScale: FontStep;
  setFontScale: (step: FontStep) => void;
} {
  const [fontScale, setFontScale] = useLocalStorage<FontStep>(
    STORAGE_KEY,
    DEFAULT,
    parse,
  );

  // Reflect the choice into the CSS custom property BEFORE the browser paints
  // (useLayoutEffect, not useEffect) so returning users never see a size jump.
  // Remove it on unmount so surfaces that reuse traveler card components (e.g.
  // the admin day view) fall back to 1× instead of inheriting a lingering scale.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--font-scale", String(scaleFor(fontScale)));
    return () => {
      root.style.removeProperty("--font-scale");
    };
  }, [fontScale]);

  return { fontScale, setFontScale };
}
