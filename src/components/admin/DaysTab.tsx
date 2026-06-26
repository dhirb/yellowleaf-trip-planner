import type { Trip } from "../../types";
import { bigDate } from "../../lib/date";
import { imgFor } from "../../lib/dayView";
import { ui } from "../../lib/ui";
import { CloseIcon, PlusIcon, SparkleIcon } from "../../lib/icons";
import { useSwipe } from "../../hooks/useSwipe";
import { DayStrip } from "../traveler/DayStrip";
import {
  addFlight,
  addItem,
  delFlight,
  delItem,
  setDayField,
  setItemContent,
  updateFlight,
  updateItem,
  updateStay,
} from "../../lib/editTrip";

interface DaysTabProps {
  trip: Trip;
  dayIndex: number;
  onSelectDay: (i: number) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  update: (updater: (t: Trip) => Trip) => void;
  onAskAI: (di: number, ii: number) => void;
  aiBusyKey: string;
}

const fieldInput = {
  height: 40,
  borderRadius: 10,
  border: "1px solid #E7DFD2",
  padding: "0 10px",
  fontSize: 14,
  color: "#1F1B16",
  boxSizing: "border-box",
  outline: "none",
  background: "#fff",
  fontFamily: "inherit",
} as const;

const flightInput = { ...fieldInput, border: "1px solid #CBDDEC" } as const;

const NavBtn = ({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) => (
  <button
    onClick={onClick}
    aria-label={dir === "left" ? "Previous day" : "Next day"}
    style={{ width: 42, height: 42, borderRadius: 13, border: "1px solid #ECE4D8", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}
  >
    <svg width="10" height="16" viewBox="0 0 12 20" fill="none">
      <path d={dir === "left" ? "M10 2L2 10l8 8" : "M2 2l8 8-8 8"} stroke="#7A6F60" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </button>
);

const SectionLabel = ({ children, color = "#A89F92" }: { children: string; color?: string }) => (
  <div style={{ fontSize: 11.5, fontWeight: 800, color, letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 8 }}>
    {children}
  </div>
);

const DeleteBtn = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    aria-label="Delete"
    style={{ width: 36, height: 36, borderRadius: 10, background: "#FBEEEC", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, border: "none" }}
  >
    <CloseIcon size={16} />
  </button>
);

const AddRow = ({ label, color, onClick }: { label: string; color: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, height: 46, width: "100%", borderRadius: 14, border: `1.5px dashed ${color}55`, color, fontSize: 14.5, fontWeight: 700, cursor: "pointer", background: "none", fontFamily: "inherit" }}
  >
    <PlusIcon size={18} color={color} />
    {label}
  </button>
);

export function DaysTab({ trip, dayIndex, onSelectDay, onPrevDay, onNextDay, update, onAskAI, aiBusyKey }: DaysTabProps) {
  const di = Math.max(0, Math.min(dayIndex, trip.days.length - 1));
  const day = trip.days[di];
  const swipe = useSwipe(onPrevDay, onNextDay);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <NavBtn dir="left" onClick={onPrevDay} />
        <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.3px" }}>{bigDate(day.date)}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#8A8175" }}>
            Day {di + 1} of {trip.days.length}
          </div>
        </div>
        <NavBtn dir="right" onClick={onNextDay} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <DayStrip days={trip.days} current={di} today="" onSelect={onSelectDay} size={48} markToday={false} />
      </div>

      <div
        onPointerDown={swipe.onPointerDown}
        onPointerMove={swipe.onPointerMove}
        onPointerUp={swipe.onPointerUp}
        onPointerLeave={swipe.onPointerUp}
        style={{ touchAction: "pan-y" }}
      >
        <div style={{ transform: `translateX(${swipe.dragX}px)`, transition: swipe.dragging ? "none" : "transform .28s cubic-bezier(.22,.61,.36,1)" }}>
          {/* Day title */}
          <div style={{ marginBottom: 14 }}>
            <SectionLabel>Day title</SectionLabel>
            <input
              value={day.theme}
              onChange={(e) => update((t) => setDayField(t, di, "theme", e.target.value))}
              style={{ ...ui.input, height: 48, fontWeight: 700, color: "#C2541F" }}
            />
          </div>

          {/* Flights */}
          <SectionLabel color="#1E6FA8">Flights</SectionLabel>
          {(day.flights ?? []).map((f, fi) => (
            <div key={fi} style={{ background: "#EAF2F9", border: "1px solid #D2E3F0", borderRadius: 14, padding: 10, marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <input value={f.time} onChange={(e) => update((t) => updateFlight(t, di, fi, "time", e.target.value))} placeholder="Time" style={{ ...flightInput, width: 62, fontWeight: 700, flexShrink: 0 }} />
                <input value={f.flightNo} onChange={(e) => update((t) => updateFlight(t, di, fi, "flightNo", e.target.value))} placeholder="Flight no." style={{ ...flightInput, flex: 1, minWidth: 0, fontWeight: 700 }} />
                <DeleteBtn onClick={() => update((t) => delFlight(t, di, fi))} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={f.from} onChange={(e) => update((t) => updateFlight(t, di, fi, "from", e.target.value))} placeholder="From" style={{ ...flightInput, flex: 1, minWidth: 0, fontWeight: 600 }} />
                <input value={f.to} onChange={(e) => update((t) => updateFlight(t, di, fi, "to", e.target.value))} placeholder="To" style={{ ...flightInput, flex: 1, minWidth: 0, fontWeight: 600 }} />
              </div>
            </div>
          ))}
          <div style={{ marginBottom: 16 }}>
            <AddRow label="Add flight" color="#2C6E9B" onClick={() => update((t) => addFlight(t, di))} />
          </div>

          {/* Activities */}
          <SectionLabel>Activities</SectionLabel>
          {day.items.map((it, ii) => {
            const busy = aiBusyKey === `${di}-${ii}`;
            return (
              <div key={ii} style={{ ...ui.card, padding: 11, marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: `center/cover url("${imgFor(it, 120, 120)}")`, flexShrink: 0, boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }} />
                  <input value={it.time} onChange={(e) => update((t) => updateItem(t, di, ii, "time", e.target.value))} style={{ ...fieldInput, height: 42, width: 62, fontWeight: 700, flexShrink: 0 }} />
                  <input value={it.title} onChange={(e) => update((t) => updateItem(t, di, ii, "title", e.target.value))} style={{ ...fieldInput, height: 42, flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600 }} />
                  <DeleteBtn onClick={() => update((t) => delItem(t, di, ii))} />
                </div>
                <textarea
                  value={it.note ?? ""}
                  onChange={(e) => update((t) => setItemContent(t, di, ii, { note: e.target.value }))}
                  placeholder="Description"
                  style={{ width: "100%", marginTop: 8, minHeight: 54, borderRadius: 10, border: "1px solid #E7DFD2", padding: "8px 10px", fontSize: 13.5, fontWeight: 500, color: "#1F1B16", boxSizing: "border-box", outline: "none", fontFamily: "inherit", resize: "vertical", lineHeight: 1.45 }}
                />
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                  <input value={it.image ?? ""} onChange={(e) => update((t) => setItemContent(t, di, ii, { image: e.target.value }))} placeholder="Image URL" style={{ ...fieldInput, flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600 }} />
                  <button
                    onClick={() => onAskAI(di, ii)}
                    disabled={busy}
                    style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, height: 40, padding: "0 14px", borderRadius: 10, background: "#1F1B16", color: "#fff", fontSize: 13.5, fontWeight: 800, cursor: busy ? "default" : "pointer", border: "none", fontFamily: "inherit", opacity: busy ? 0.7 : 1 }}
                  >
                    <SparkleIcon />
                    {busy ? "Generating…" : "Ask AI"}
                  </button>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 2 }}>
            <AddRow label="Add activity" color="#8A8175" onClick={() => update((t) => addItem(t, di))} />
          </div>

          {/* Accommodation */}
          <div style={{ margin: "16px 0 8px" }}>
            <SectionLabel color="#3B5B8C">Accommodation</SectionLabel>
          </div>
          <div style={{ background: "#EEF2F8", border: "1px solid #DCE5F0", borderRadius: 14, padding: 11, display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "#3B5B8C", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 17v-4a2 2 0 0 1 2-2h9a4 4 0 0 1 4 4v2M3 14h18M3 17v3M21 17v3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 7 }}>
              <input value={day.stay?.name ?? ""} onChange={(e) => update((t) => updateStay(t, di, "name", e.target.value))} placeholder="Hotel name" style={{ ...fieldInput, width: "100%", height: 38, border: "1px solid #CFDAEA", fontSize: 14.5, fontWeight: 700 }} />
              <input value={day.stay?.desc ?? ""} onChange={(e) => update((t) => updateStay(t, di, "desc", e.target.value))} placeholder="Short description" style={{ ...fieldInput, width: "100%", height: 38, border: "1px solid #CFDAEA", fontSize: 13.5, fontWeight: 500 }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
