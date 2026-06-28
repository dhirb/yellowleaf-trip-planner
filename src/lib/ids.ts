/** Small id + colour helpers. */

const COVERS = [
  "#C2541F",
  "#2F7D5B",
  "#3B5B8C",
  "#7A5AA6",
  "#B5701A",
  "#1E6FA8",
];

/** Pick a stable-ish cover colour for a new trip. */
export function pickCover(seed: number): string {
  return COVERS[seed % COVERS.length];
}
