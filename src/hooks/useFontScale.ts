import { useCallback, useEffect, useState } from "react";
import { type FontStep, isFontStep, scaleFor } from "../lib/fontScale";

const STORAGE_KEY = "yl:fontScale";
const DEFAULT: FontStep = "standard";

function read(): FontStep {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isFontStep(v) ? v : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

/**
 * The traveler's text-size preference, persisted per-device in localStorage so
 * it sticks across visits and applies to every trip. On change it writes
 * `--font-scale` to the document root; the type tokens in tokens.css multiply
 * their base px by it, so all traveler text resizes together. The admin view
 * never references those tokens, so it is unaffected (fallback resolves to 1).
 */
export function useFontScale(): {
  fontScale: FontStep;
  setFontScale: (step: FontStep) => void;
} {
  const [fontScale, setFontScale] = useState<FontStep>(read);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, fontScale);
    } catch {
      // Private mode / storage disabled — fall back to in-memory state only.
    }
    document.documentElement.style.setProperty(
      "--font-scale",
      String(scaleFor(fontScale)),
    );
  }, [fontScale]);

  const set = useCallback((step: FontStep) => setFontScale(step), []);

  return { fontScale, setFontScale: set };
}
