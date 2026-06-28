import { useCallback, useEffect, useState } from "react";
import { readStored, writeStored } from "../lib/storage";

/**
 * A value persisted per-device in localStorage. Lazily initialises from storage
 * (falling back when absent / invalid / unavailable) and writes back on every
 * change. `parse` owns validation so each caller can narrow the untrusted stored
 * string to its own type; `serialize` defaults to `String` for plain values.
 */
export function useLocalStorage<T>(
  key: string,
  fallback: T,
  parse: (raw: string | null) => T | null,
  serialize: (value: T) => string = String,
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => readStored(key, parse, fallback));

  useEffect(() => {
    writeStored(key, serialize(value));
  }, [key, value, serialize]);

  const set = useCallback((next: T) => setValue(next), []);

  return [value, set];
}
