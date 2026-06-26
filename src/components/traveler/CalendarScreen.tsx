import type { CSSProperties } from "react";
import type { Trip } from "../../types";
import { dayOfMonth, fmt } from "../../lib/date";
import { ui } from "../../lib/ui";
import { Chevron } from "../../lib/icons";

interface CalendarScreenProps {
  trip: Trip;
  dayIndex: number;
  today: string;
  onOpenDay: (i: number) => void;
}

const WEEK = ["S", "M", "T", "W", "T", "F", "S"];
const pad = (n: number) => String(n).padStart(2, "0");

interface Cell {
  key: string;
  label: number | null;
  style: CSSProperties;
  onTap?: () => void;
}

export function CalendarScreen({ trip, dayIndex, today, onOpenDay }: CalendarScreenProps) {
  const now = new Date();
  const yr = now.getFullYear();
  const mo = now.getMonth();
  const dim = new Date(yr, mo + 1, 0).getDate();
  const lead = new Date(yr, mo, 1).getDay();
  const calMonth = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const cells: Cell[] = [];
  for (let i = 0; i < lead; i++) cells.push({ key: `e${i}`, label: null, style: {} });
  for (let n = 1; n <= dim; n++) {
    const ds = `${yr}-${pad(mo + 1)}-${pad(n)}`;
    const idx = trip.days.findIndex((d) => d.date === ds);
    const inTrip = idx >= 0;
    const isToday = ds === today;
    const on = inTrip && idx === dayIndex;
    cells.push({
      key: ds,
      label: n,
      onTap: inTrip ? () => onOpenDay(idx) : undefined,
      style: {
        aspectRatio: "1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 13,
        fontSize: 15.5,
        fontWeight: on ? 800 : inTrip ? 700 : 500,
        cursor: inTrip ? "pointer" : "default",
        color: on ? "#fff" : inTrip ? "#C2541F" : "#C8BFB0",
        background: on ? "#C2541F" : inTrip ? "#F6E7DC" : "transparent",
        border: isToday && !on ? "2px solid #C2541F" : "2px solid transparent",
      },
    });
  }

  return (
    <>
      <div style={{ padding: "54px 18px 12px", flexShrink: 0 }}>
        <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-0.5px" }}>Trip calendar</div>
        <div style={{ fontSize: 15, color: "#8A8175", fontWeight: 500, marginTop: 3 }}>Tap a highlighted day to open it</div>
      </div>
      <div className="no-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", padding: "4px 18px 26px" }}>
        <div style={ui.padCard}>
          <div style={{ fontSize: 17, fontWeight: 800, textAlign: "center", marginBottom: 14 }}>{calMonth}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
            {WEEK.map((w, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 11.5, fontWeight: 700, color: "#B0A693" }}>
                {w}
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
            {cells.map((c) => (
              <div key={c.key} onClick={c.onTap} style={c.style}>
                {c.label ?? ""}
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 800, color: "#A89F92", letterSpacing: "0.6px", textTransform: "uppercase", margin: "22px 4px 12px" }}>
          All days
        </div>
        {trip.days.map((d, i) => (
          <button
            key={d.date + i}
            onClick={() => onOpenDay(i)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: 14,
              borderRadius: 16,
              marginBottom: 10,
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
              fontFamily: "inherit",
              background: i === dayIndex ? "#FBEFE0" : "#fff",
              border: `1px solid ${i === dayIndex ? "#E9C49B" : "#EFE8DD"}`,
            }}
          >
            <div style={{ width: 50, textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#C2541F", lineHeight: 1 }}>{dayOfMonth(d.date)}</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#A89F92", textTransform: "uppercase" }}>
                {fmt(d.date, { month: "short" })}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16.5, fontWeight: 700 }}>{d.theme}</div>
              <div style={{ fontSize: 13.5, color: "#8A8175", fontWeight: 600, marginTop: 1 }}>
                {fmt(d.date, { weekday: "long" })} · {d.items.length} stops
              </div>
            </div>
            <Chevron dir="right" size={14} />
          </button>
        ))}
      </div>
    </>
  );
}
