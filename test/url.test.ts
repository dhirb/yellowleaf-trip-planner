import { describe, it, expect } from "vitest";
import { safeImageUrl } from "../src/lib/url";

describe("safeImageUrl", () => {
  it("accepts a well-formed https URL", () => {
    expect(safeImageUrl("https://upload.wikimedia.org/a/b.jpg")).toBe(
      "https://upload.wikimedia.org/a/b.jpg",
    );
  });

  it("trims surrounding whitespace", () => {
    expect(safeImageUrl("  https://x.com/p.png  ")).toBe("https://x.com/p.png");
  });

  it("returns null for empty, null, or undefined input", () => {
    expect(safeImageUrl("")).toBeNull();
    expect(safeImageUrl("   ")).toBeNull();
    expect(safeImageUrl(null)).toBeNull();
    expect(safeImageUrl(undefined)).toBeNull();
  });

  it("rejects non-https protocols", () => {
    expect(safeImageUrl("http://x.com/p.png")).toBeNull();
    expect(safeImageUrl("javascript:alert(1)")).toBeNull();
    expect(safeImageUrl("data:image/png;base64,AAAA")).toBeNull();
  });

  it("rejects malformed URLs", () => {
    expect(safeImageUrl("not a url")).toBeNull();
    expect(safeImageUrl("/relative/path.png")).toBeNull();
  });

  it('neutralizes a CSS url("...") breakout attempt', () => {
    // The quote that would terminate the url("...") context is percent-encoded,
    // so the returned value (if any) is safe to embed.
    const result = safeImageUrl('https://x.com/a") ; background: url(evil');
    expect(result === null || !/["']/.test(result)).toBe(true);
  });

  it("never returns a value containing a quote", () => {
    for (const input of ['https://x.com/"onerror', "https://x.com/'onerror"]) {
      const result = safeImageUrl(input);
      expect(result === null || !/["']/.test(result)).toBe(true);
    }
  });
});
