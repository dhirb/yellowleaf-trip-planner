import type { CSSProperties } from "react";
import type { ContactKind, ItemKind } from "../types";

/** Ink/neutral palette (kept in sync with tokens.css). */
export const INK = "#1F1B16";
export const MUTED = "#A89F92";
export const ACCENT = "#C2541F";

/** Strong category colours (icon chips, accents). */
export const ACC: Record<ItemKind, string> = {
  attraction: "#C2541F",
  meal: "#2F7D5B",
  stay: "#3B5B8C",
  transport: "#7A5AA6",
  other: "#8A8175",
};

/** Soft category tints (tag pills). */
export const SOFT: Record<ItemKind, string> = {
  attraction: "#F6E7DC",
  meal: "#DDEFE5",
  stay: "#E1E9F4",
  transport: "#EBE3F4",
  other: "#EFEAE0",
};

/** Contact chip colours. */
export const CONTACT_COLOR: Record<ContactKind, string> = {
  emergency: "#C0392B",
  family: "#2F7D5B",
  hotel: "#3B5B8C",
  embassy: "#7A5AA6",
  other: "#8A8175",
};

/** Shared surface/control styles, ported from the prototype's `ui` object. */
export const ui = {
  app: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    background: "#FBF8F3",
    color: INK,
    fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
    position: "relative",
    overflow: "hidden",
    WebkitFontSmoothing: "antialiased",
  } satisfies CSSProperties,
  header: { padding: "54px 18px 0", background: "#FBF8F3", flexShrink: 0 } satisfies CSSProperties,
  body: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    touchAction: "pan-y",
    WebkitOverflowScrolling: "touch",
  } satisfies CSSProperties,
  card: {
    background: "#fff",
    borderRadius: 20,
    border: "1px solid #EFE8DD",
    boxShadow: "0 6px 18px rgba(80,55,25,0.05)",
  } satisfies CSSProperties,
  padCard: {
    background: "#fff",
    borderRadius: 20,
    border: "1px solid #EFE8DD",
    boxShadow: "0 6px 18px rgba(80,55,25,0.05)",
    padding: 18,
  } satisfies CSSProperties,
  cardRow: {
    background: "#fff",
    borderRadius: 18,
    border: "1px solid #EFE8DD",
    boxShadow: "0 4px 14px rgba(80,55,25,0.05)",
    padding: 15,
    display: "flex",
    gap: 14,
    alignItems: "center",
    cursor: "pointer",
    marginBottom: 12,
  } satisfies CSSProperties,
  listCard: {
    background: "#fff",
    borderRadius: 18,
    border: "1px solid #EFE8DD",
    boxShadow: "0 4px 14px rgba(80,55,25,0.05)",
    overflow: "hidden",
  } satisfies CSSProperties,
  chevBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    border: "1px solid #ECE4D8",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(80,55,25,0.06)",
  } satisfies CSSProperties,
  btnPrimary: {
    height: 56,
    borderRadius: 16,
    background: "#C2541F",
    color: "#fff",
    border: "none",
    fontFamily: "inherit",
    fontSize: 18,
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
    boxShadow: "0 10px 24px rgba(194,84,31,0.3)",
  } satisfies CSSProperties,
  btnGhost: {
    height: 54,
    borderRadius: 16,
    background: "#fff",
    color: INK,
    border: "1px solid #E3DACB",
    fontFamily: "inherit",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
  } satisfies CSSProperties,
  input: {
    width: "100%",
    height: 54,
    borderRadius: 14,
    border: "1px solid #E2DACC",
    background: "#fff",
    padding: "0 16px",
    fontFamily: "inherit",
    fontSize: 17,
    color: INK,
    boxSizing: "border-box",
    outline: "none",
  } satisfies CSSProperties,
  tabbar: {
    flexShrink: 0,
    display: "flex",
    borderTop: "1px solid #EDE6DB",
    background: "rgba(251,248,243,0.97)",
    paddingBottom: 26,
    paddingTop: 9,
  } satisfies CSSProperties,
};

/** Segmented-control pill style (layout switcher, editor tabs). */
export function seg(on: boolean): CSSProperties {
  return {
    flex: 1,
    textAlign: "center",
    padding: "9px 0",
    borderRadius: 11,
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "pointer",
    background: on ? "#fff" : "transparent",
    color: on ? INK : "#9A9183",
    boxShadow: on ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
    transition: "all .15s",
  };
}
