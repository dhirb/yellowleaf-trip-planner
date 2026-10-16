import { useLayoutEffect, useRef, type RefObject } from "react";
import type { Day } from "../../types";
import { dayOfMonth, fmt } from "../../lib/date";
import { cn } from "../../lib/cn";

/** Breathing room (px) left between a scrolled-into-view chip and the edge. */
const SCROLL_PAD = 8;

interface DayStripProps {
  days: Day[];
  current: number;
  today: string;
  onSelect: (i: number) => void;
  /** Chip width — 52 for traveler, 48 for the admin editor. */
  size?: number;
  /** Show a faint ring on "today" (traveler only). */
  markToday?: boolean;
  /**
   * Horizontal offset shared by every strip instance in a pager. Each
   * SwipePager panel mounts its own strip, so without this the strip the
   * traveler scrolled by hand would be swapped for a fresh one at offset 0
   * whenever they pick a day.
   */
  scrollMemory?: RefObject<number>;
  /** Whether this strip's panel is the one on screen (vs. a neighbour). */
  active?: boolean;
}

/** Horizontal scroller of day chips, shared by traveler and admin. */
export function DayStrip({
  days,
  current,
  today,
  onSelect,
  size = 52,
  markToday = true,
  scrollMemory,
  active = true,
}: DayStripProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Neighbour strips mirror the shared offset on every render (SwipePager
  // re-renders them when a drag starts), so they slide in already aligned
  // with the strip the traveler was looking at.
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || active || !scrollMemory) return;
    scroller.scrollLeft = scrollMemory.current;
  });

  // On becoming the on-screen strip, adopt the shared offset before paint so
  // the swap of strip instances is invisible, then keep the selected chip in
  // view, nudging only when it has drifted past either edge.
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const chip = selectedRef.current;
    if (!scroller || !chip || !active) return;
    if (scrollMemory) scroller.scrollLeft = scrollMemory.current;

    const scRect = scroller.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();

    if (chipRect.left < scRect.left + SCROLL_PAD) {
      scroller.scrollBy({
        left: chipRect.left - scRect.left - SCROLL_PAD,
        behavior: "smooth",
      });
    } else if (chipRect.right > scRect.right - SCROLL_PAD) {
      scroller.scrollBy({
        left: chipRect.right - scRect.right + SCROLL_PAD,
        behavior: "smooth",
      });
    }
  }, [current, active, scrollMemory]);

  // Only the on-screen strip records where the traveler scrolled; a
  // neighbour's programmatic sync must never overwrite it.
  const onScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller || !active || !scrollMemory) return;
    scrollMemory.current = scroller.scrollLeft;
  };

  return (
    <div
      ref={scrollerRef}
      data-testid="day-strip"
      onScroll={onScroll}
      className={cn(
        "no-scrollbar flex overflow-x-auto px-[2px] pt-[2px] pb-1",
        size === 52 ? "gap-2" : "gap-[7px]",
      )}
    >
      {days.map((d, i) => {
        const on = i === current;
        const isToday = markToday && d.date === today;
        return (
          <button
            key={d.date + i}
            ref={on ? selectedRef : undefined}
            onClick={() => onSelect(i)}
            className={cn(
              "shrink-0 cursor-pointer rounded-[15px] border text-center [font-family:inherit]",
              size === 52 ? "py-[9px]" : "py-2",
              on ? "bg-accent" : "bg-surface",
              on
                ? "border-accent"
                : isToday
                  ? "border-accent/40"
                  : "border-border",
              on ? "shadow-[0_6px_14px_rgba(194,84,31,0.28)]" : "shadow-none",
            )}
            style={{ width: size }}
          >
            <div
              className={cn(
                "text-tag font-bold uppercase",
                on ? "text-[rgba(255,255,255,0.85)]" : "text-faint",
              )}
            >
              {fmt(d.date, { weekday: "short" })}
            </div>
            <div
              className={cn(
                "mt-0.5 text-subtitle font-extrabold",
                on ? "text-white" : "text-ink",
              )}
            >
              {dayOfMonth(d.date)}
            </div>
          </button>
        );
      })}
    </div>
  );
}
