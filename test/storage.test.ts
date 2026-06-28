import { afterEach, describe, expect, it, vi } from "vitest";
import { readStored, writeStored } from "../src/lib/storage";

interface MockOpts {
  initial?: Record<string, string>;
  throwOnGet?: boolean;
  throwOnSet?: boolean;
}

/** Install a controllable localStorage stub and return its backing store. */
function installStorage(opts: MockOpts = {}): Map<string, string> {
  const store = new Map<string, string>(Object.entries(opts.initial ?? {}));
  vi.stubGlobal("localStorage", {
    getItem(key: string): string | null {
      if (opts.throwOnGet) throw new Error("storage blocked");
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string): void {
      if (opts.throwOnSet) throw new Error("storage blocked");
      store.set(key, value);
    },
  });
  return store;
}

afterEach(() => vi.unstubAllGlobals());

const timeParse = (raw: string | null): "12h" | "24h" | null =>
  raw === "12h" || raw === "24h" ? raw : null;

describe("readStored", () => {
  it("returns the parsed stored value when present and valid", () => {
    installStorage({ initial: { "yl:t": "12h" } });
    expect(readStored("yl:t", timeParse, "24h")).toBe("12h");
  });

  it("returns the fallback when the key is missing", () => {
    installStorage();
    expect(readStored("yl:t", timeParse, "24h")).toBe("24h");
  });

  it("returns the fallback when parse rejects the stored value", () => {
    installStorage({ initial: { "yl:t": "nonsense" } });
    expect(readStored("yl:t", timeParse, "24h")).toBe("24h");
  });

  it("returns the fallback when storage access throws", () => {
    installStorage({ throwOnGet: true });
    expect(readStored("yl:t", timeParse, "24h")).toBe("24h");
  });
});

describe("writeStored", () => {
  it("persists the value", () => {
    const store = installStorage();
    writeStored("yl:t", "12h");
    expect(store.get("yl:t")).toBe("12h");
  });

  it("swallows errors when storage is unavailable", () => {
    installStorage({ throwOnSet: true });
    expect(() => writeStored("yl:t", "12h")).not.toThrow();
  });
});
