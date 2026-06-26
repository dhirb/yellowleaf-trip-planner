import type { LayoutMode, Trip } from "../../types";
import { bigDate } from "../../lib/date";
import { buildViewItems } from "../../lib/dayView";
import { ui, seg } from "../../lib/ui";
import { ActivityIcon } from "../../lib/icons";
import { useSwipe } from "../../hooks/useSwipe";
import { DayStrip } from "./DayStrip";
import { DayItems } from "./DayItems";

interface DayScreenProps {
  trip: Trip;
  dayIndex: number;
  today: string;
  useLocalLang: boolean;
  layout: LayoutMode;
  setLayout: (m: LayoutMode) => void;
  onSelectDay: (i: number) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onOpenItem: (index: number) => void;
}

const LAYOUTS: Array<[string, LayoutMode]> = [
  ["Timeline", "timeline"],
  ["Cards", "cards"],
  ["Simple", "list"],
];

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="4.5" fill="#E08A1E" />
    <g stroke="#E08A1E" strokeWidth="2" strokeLinecap="round">
      <path d="M12 3v2" />
      <path d="M12 19v2" />
      <path d="M3 12h2" />
      <path d="M19 12h2" />
      <path d="M5.5 5.5l1.4 1.4" />
      <path d="M17.1 17.1l1.4 1.4" />
      <path d="M18.5 5.5l-1.4 1.4" />
      <path d="M6.9 17.1l-1.4 1.4" />
    </g>
  </svg>
);

const NavBtn = ({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) => (
  <button onClick={onClick} style={{ ...ui.chevBtn, fontFamily: "inherit" }} aria-label={dir === "left" ? "Previous day" : "Next day"}>
    <svg width="11" height="18" viewBox="0 0 12 20" fill="none">
      <path
        d={dir === "left" ? "M10 2L2 10l8 8" : "M2 2l8 8-8 8"}
        stroke="#7A6F60"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>
);

export function DayScreen({
  trip,
  dayIndex,
  today,
  useLocalLang,
  layout,
  setLayout,
  onSelectDay,
  onPrevDay,
  onNextDay,
  onOpenItem,
}: DayScreenProps) {
  const day = trip.days[dayIndex] ?? trip.days[0];
  const viewItems = buildViewItems(day, useLocalLang);
  const swipe = useSwipe(onPrevDay, onNextDay);

  const stay = day.stay ?? trip.hotel;
  const useLStay = useLocalLang && !!stay?.localName;
  const stayName = useLStay ? (stay.localName as string) : stay?.name ?? "";
  const staySub = useLStay ? stay?.name ?? "" : stay?.desc ?? stay?.note ?? "";

  return (
    <>
      <div style={ui.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#C2541F", letterSpacing: "0.8px", textTransform: "uppercase" }}>
              {trip.dest}, {trip.country}
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#8A8175",
                marginTop: 3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {trip.title}
            </div>
          </div>
          {day.weather && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#FBEFE0",
                color: "#B5701A",
                padding: "7px 12px",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              <SunIcon />
              {day.weather}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <NavBtn dir="left" onClick={onPrevDay} />
          <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
            <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-0.6px" }}>{bigDate(day.date)}</div>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: "#8A8175", marginTop: 2 }}>
              Day {dayIndex + 1} of {trip.days.length} · {day.theme}
            </div>
          </div>
          <NavBtn dir="right" onClick={onNextDay} />
        </div>

        <div style={{ margin: "16px -2px 0" }}>
          <DayStrip days={trip.days} current={dayIndex} today={today} onSelect={onSelectDay} />
        </div>
      </div>

      <div
        className="no-scrollbar"
        style={ui.body}
        onPointerDown={swipe.onPointerDown}
        onPointerMove={swipe.onPointerMove}
        onPointerUp={swipe.onPointerUp}
        onPointerLeave={swipe.onPointerUp}
      >
        <div style={{ transform: `translateX(${swipe.dragX}px)`, transition: swipe.dragging ? "none" : "transform .28s cubic-bezier(.22,.61,.36,1)" }}>
          <div style={{ padding: "8px 18px 26px" }}>
            {/* Flights */}
            {(day.flights ?? []).map((f, i) => (
              <div
                key={i}
                style={{
                  background: "#EAF2F9",
                  border: "1px solid #D2E3F0",
                  borderRadius: 18,
                  padding: 15,
                  marginBottom: 14,
                  display: "flex",
                  gap: 14,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    background: "#1E6FA8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 5px 12px rgba(30,111,168,0.28)",
                  }}
                >
                  <ActivityIcon kind="flight" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: "#2C6E9B", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    Flight · {f.flightNo}
                  </div>
                  <div style={{ fontSize: 18.5, fontWeight: 800, margin: "2px 0", letterSpacing: "-0.2px" }}>
                    {f.kind === "departure" ? "Departs " : "Arrives "}
                    {f.time}
                  </div>
                  <div style={{ fontSize: 14.5, color: "#5C7C92", fontWeight: 600 }}>
                    {f.from} &nbsp;→&nbsp; {f.to}
                  </div>
                </div>
              </div>
            ))}

            {/* Layout switcher */}
            {viewItems.length > 0 && (
              <div style={{ display: "flex", gap: 4, background: "#F0E9DE", padding: 4, borderRadius: 14, marginBottom: 16 }}>
                {LAYOUTS.map(([label, mode]) => (
                  <button key={mode} onClick={() => setLayout(mode)} style={{ ...seg(layout === mode), border: "none", fontFamily: "inherit" }}>
                    {label}
                  </button>
                ))}
              </div>
            )}

            <DayItems items={viewItems} layout={layout} onOpen={onOpenItem} />

            {/* Accommodation */}
            {stayName && (
              <div style={{ ...ui.padCard, marginTop: 18, display: "flex", gap: 14, alignItems: "center" }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    background: "#3B5B8C",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 17v-4a2 2 0 0 1 2-2h9a4 4 0 0 1 4 4v2M3 14h18M3 17v3M21 17v3"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#A89F92", letterSpacing: "0.6px", textTransform: "uppercase" }}>
                    Where you're staying
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>{stayName}</div>
                  <div style={{ fontSize: 14, color: "#8A8175", fontWeight: 500, marginTop: 1 }}>{staySub}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
