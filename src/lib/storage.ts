/**
 * Tiny localStorage wrappers that never throw. Private-mode or disabled storage
 * degrades to in-memory behaviour at the call site (the caller keeps React
 * state) rather than crashing a render.
 */

/**
 * Read and validate a stored value. `parse` narrows the untrusted stored string
 * (or null when absent) to `T`, returning null to reject it; on null/invalid/
 * throw we return `fallback`.
 */
export function readStored<T>(
  key: string,
  parse: (raw: string | null) => T | null,
  fallback: T,
): T {
  try {
    const parsed = parse(localStorage.getItem(key));
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

/** Persist a value, swallowing errors when storage is unavailable. */
export function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode / storage disabled — caller keeps in-memory state only.
  }
}
