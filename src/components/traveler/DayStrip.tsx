import { useEffect, useRef } from "react";
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
}

/** Horizontal scroller of day chips, shared by traveler and admin. */
export function DayStrip({
  days,
  current,
  today,
  onSelect,
  size = 52,
  markToday = true,
}: DayStripProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Keep the selected chip fully in view, nudging the strip horizontally only
  // when the chip has drifted past either edge.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const chip = selectedRef.current;
    if (!scroller || !chip) return;

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
  }, [current]);

  return (
    <div
      ref={scrollerRef}
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
                  ? "border-[#e6b68e]"
                  : "border-[#ece4d8]",
              on ? "shadow-[0_6px_14px_rgba(194,84,31,0.28)]" : "shadow-none",
            )}
            style={{ width: size }}
          >
            <div
              className={cn(
                "text-[11.5px] font-bold uppercase",
                on ? "text-[rgba(255,255,255,0.85)]" : "text-faint",
              )}
            >
              {fmt(d.date, { weekday: "short" })}
            </div>
            <div
              className={cn(
                "mt-0.5 text-[19px] font-extrabold",
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
