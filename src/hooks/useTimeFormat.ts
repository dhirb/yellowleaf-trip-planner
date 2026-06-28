import type { TimeFormat } from "../lib/date";
import { useLocalStorage } from "./useLocalStorage";

const STORAGE_KEY = "yl:timeFormat";
const DEFAULT: TimeFormat = "24h";

const parse = (raw: string | null): TimeFormat | null =>
  raw === "12h" || raw === "24h" ? raw : null;

/**
 * The traveler's clock preference, persisted per-device in localStorage so it
 * sticks across visits (unlike the per-session language choice).
 */
export function useTimeFormat(): {
  timeFormat: TimeFormat;
  setTimeFormat: (fmt: TimeFormat) => void;
} {
  const [timeFormat, setTimeFormat] = useLocalStorage<TimeFormat>(
    STORAGE_KEY,
    DEFAULT,
    parse,
  );

  return { timeFormat, setTimeFormat };
}
