import type { ItemKind } from "../types";

type PathProps = { d: string };

/** Activity/category glyphs, ported 1:1 from the prototype's `icon()`. */
export function ActivityIcon({
  kind,
  size = 22,
  color = "#fff",
}: {
  kind: ItemKind | "flight";
  size?: number;
  color?: string;
}) {
  const P = ({ d }: PathProps) => (
    <path d={d} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  );
  const paths: Record<ItemKind | "flight", string[]> = {
    attraction: ["M2 8l10-5 10 5", "M4 8h16", "M6 11v9", "M18 11v9", "M11 11v9", "M3 20h18"],
    meal: ["M6 3v6", "M9 3v6", "M7.5 9v11", "M15 3c2 1 2 5 0 7v10"],
    stay: [
      "M3 17v-4a2 2 0 0 1 2-2h9a4 4 0 0 1 4 4v2",
      "M3 14h18",
      "M3 17v3",
      "M21 17v3",
      "M6.5 11V9.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V11",
    ],
    transport: [
      "M7 4h10a2 2 0 0 1 2 2v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2z",
      "M5 11h14",
      "M9 21l-1.5 1.5",
      "M15 21l1.5 1.5",
      "M9 7h6",
    ],
    flight: ["M21 3L10 14", "M21 3l-7 19-3.5-8.5L2 10z"],
    other: ["M12 7v5l3 2"],
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {paths[kind].map((d, i) => (
        <P key={i} d={d} />
      ))}
    </svg>
  );
}

/** Small AI sparkle used on the "Ask AI" button. */
export function SparkleIcon({ size = 15, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" fill={color} />
      <path d="M19 14l.7 1.9L21.6 16.6l-1.9.7L19 19.2l-.7-1.9L16.4 16.6l1.9-.7L19 14z" fill={color} />
    </svg>
  );
}

/** Chevron used on rows and nav arrows. */
export function Chevron({
  dir = "right",
  size = 14,
  color = "#CFC6B5",
  width = 2,
}: {
  dir?: "left" | "right";
  size?: number;
  color?: string;
  width?: number;
}) {
  const d = dir === "left" ? "M10 2L2 10l8 8" : "M2 2l8 8-8 8";
  const w = dir === "left" ? 12 : dir === "right" && size <= 14 ? 8 : 12;
  const vb = w === 8 ? "0 0 8 14" : "0 0 12 20";
  const dd = w === 8 ? "M1 1l6 6-6 6" : d;
  return (
    <svg width={(size * w) / 14} height={size} viewBox={vb} fill="none">
      <path d={dd} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Plus icon for "add" affordances. */
export function PlusIcon({ size = 18, color = "#8A8175", width = 2.4 }: { size?: number; color?: string; width?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke={color} strokeWidth={width} strokeLinecap="round" />
    </svg>
  );
}

/** Close / delete X icon. */
export function CloseIcon({ size = 16, color = "#C0392B", width = 2.4 }: { size?: number; color?: string; width?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={width} strokeLinecap="round" />
    </svg>
  );
}
