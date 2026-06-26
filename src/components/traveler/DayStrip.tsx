import type { Day } from "../../types";
import { dayOfMonth, fmt } from "../../lib/date";
import { ACCENT, INK } from "../../lib/ui";

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
export function DayStrip({ days, current, today, onSelect, size = 52, markToday = true }: DayStripProps) {
  return (
    <div
      className="no-scrollbar"
      style={{ display: "flex", gap: size === 52 ? 8 : 7, overflowX: "auto", padding: "2px 2px 4px" }}
    >
      {days.map((d, i) => {
        const on = i === current;
        const isToday = markToday && d.date === today;
        return (
          <button
            key={d.date + i}
            onClick={() => onSelect(i)}
            style={{
              flexShrink: 0,
              width: size,
              padding: size === 52 ? "9px 0" : "8px 0",
              borderRadius: 15,
              textAlign: "center",
              cursor: "pointer",
              fontFamily: "inherit",
              background: on ? ACCENT : "#fff",
              border: `1px solid ${on ? ACCENT : isToday ? "#E6B68E" : "#ECE4D8"}`,
              boxShadow: on ? "0 6px 14px rgba(194,84,31,0.28)" : "none",
            }}
          >
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                textTransform: "uppercase",
                color: on ? "rgba(255,255,255,0.85)" : "#A89F92",
              }}
            >
              {fmt(d.date, { weekday: "short" })}
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, marginTop: 2, color: on ? "#fff" : INK }}>
              {dayOfMonth(d.date)}
            </div>
          </button>
        );
      })}
    </div>
  );
}
