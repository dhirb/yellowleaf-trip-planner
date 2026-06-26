/** Small id + colour helpers. */

const COVERS = ["#C2541F", "#2F7D5B", "#3B5B8C", "#7A5AA6", "#B5701A", "#1E6FA8"];

/** Pick a stable-ish cover colour for a new trip. */
export function pickCover(seed: number): string {
  return COVERS[seed % COVERS.length];
}

/** Deterministic image fallback so the UI never shows a broken thumbnail. */
export function fallbackImage(title: string, w = 320, h = 240): string {
  const seed = encodeURIComponent((title || "a").slice(0, 20));
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}
