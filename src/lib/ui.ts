import type { Contact, ContactKind, ItemKind } from "../types";
import { cn } from "./cn";

/** Ink/neutral palette (kept in sync with tokens.css) for dynamic inline styles. */
export const INK = "#1F1B16";
export const MUTED = "#A89F92";
export const ACCENT = "#C2541F";

/** Strong category colours (icon chips, accents). Used for data-driven inline styles. */
export const ACC: Record<ItemKind, string> = {
  attraction: "#C2541F",
  meal: "#2F7D5B",
  stay: "#3B5B8C",
  transport: "#7A5AA6",
  other: "#8A8175",
};

/** Soft category tints (tag pills). Used for data-driven inline styles. */
export const SOFT: Record<ItemKind, string> = {
  attraction: "#F6E7DC",
  meal: "#DDEFE5",
  stay: "#E1E9F4",
  transport: "#EBE3F4",
  other: "#EFEAE0",
};

/** Contact chip colours. Used for data-driven inline styles. */
export const CONTACT_COLOR: Record<ContactKind, string> = {
  emergency: "#C0392B",
  family: "#2F7D5B",
  hotel: "#3B5B8C",
  embassy: "#7A5AA6",
  other: "#8A8175",
};

/** Resolve a contact's dot colour: admin override first, then the kind default. */
export const contactColor = (c: Contact): string =>
  c.color ?? CONTACT_COLOR[c.kind] ?? "#8A8175";

/**
 * Shared surface/control class strings, ported from the prototype's `ui` object.
 * Combine with overrides via `cn(ui.card, "mb-4")` so conflicting utilities
 * resolve correctly.
 */
export const ui = {
  app: "relative flex h-full flex-col overflow-hidden bg-app-bg font-sans text-ink antialiased",
  header:
    "shrink-0 bg-app-bg px-[18px] pt-[max(env(safe-area-inset-top),14px)]",
  body: "flex-1 touch-pan-y overflow-x-hidden overflow-y-auto [-webkit-overflow-scrolling:touch]",
  card: "rounded-xl border border-border bg-surface shadow-card",
  padCard: "rounded-xl border border-border bg-surface p-[18px] shadow-card",
  cardRow:
    "mb-3 flex cursor-pointer items-center gap-[14px] rounded-lg border border-border bg-surface p-[15px] shadow-soft",
  chevBtn:
    "flex h-[50px] w-[50px] shrink-0 cursor-pointer items-center justify-center rounded-[16px] border border-[#ece4d8] bg-surface shadow-[0_2px_8px_rgba(80,55,25,0.06)]",
  btnPrimary:
    "h-[56px] w-full cursor-pointer rounded-[16px] border-none bg-accent text-[18px] font-bold text-white shadow-accent",
  btnGhost:
    "h-[54px] w-full cursor-pointer rounded-[16px] border border-[#e3dacb] bg-surface text-[16px] font-bold text-ink",
  input:
    "h-[54px] w-full rounded-md border border-border-strong bg-surface px-4 text-[17px] text-ink outline-none",
  tabbar:
    "flex shrink-0 border-t border-[#ede6db] bg-[rgba(251,248,243,0.97)] pt-[6px] pb-[max(env(safe-area-inset-bottom),8px)]",
} as const;

/** Segmented-control pill classes (editor tabs). */
export function seg(on: boolean): string {
  return cn(
    "flex-1 cursor-pointer rounded-[11px] py-[9px] text-center text-[13.5px] font-bold transition-all duration-150",
    on
      ? "bg-surface text-ink shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
      : "bg-transparent text-[#9a9183] shadow-none",
  );
}
