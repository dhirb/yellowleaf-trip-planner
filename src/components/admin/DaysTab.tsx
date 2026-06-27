import type { Trip } from "../../types";
import { bigDate } from "../../lib/date";
import { imgFor } from "../../lib/dayView";
import { cn } from "../../lib/cn";
import { ui } from "../../lib/ui";
import {
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useSwipe } from "../../hooks/useSwipe";
import { DayStrip } from "../traveler/DayStrip";
import { AddRow } from "../ui/AddRow";
import { ReorderControls } from "../ui/ReorderControls";
import {
  addFlight,
  addItem,
  delFlight,
  delItem,
  moveFlight,
  moveItem,
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
  hasLanguages: boolean;
  translateBusyKey: string;
  onTranslateItem: (di: number, ii: number) => void;
  onTranslateStay: (di: number) => void;
  onTranslateDay: (di: number) => void;
}

const fieldInput =
  "h-11 rounded-sm border border-[#e7dfd2] bg-surface px-[10px] py-0 text-[14px] text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15";

const flightInput = cn(fieldInput, "border-[#cbddec]");

const NavBtn = ({
  dir,
  onClick,
}: {
  dir: "left" | "right";
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    aria-label={dir === "left" ? "Previous day" : "Next day"}
    className="flex h-[42px] w-[42px] shrink-0 cursor-pointer items-center justify-center rounded-[13px] border border-[#ece4d8] bg-surface"
  >
    {dir === "left" ? (
      <ChevronLeft size={20} color="#7A6F60" strokeWidth={2.6} />
    ) : (
      <ChevronRight size={20} color="#7A6F60" strokeWidth={2.6} />
    )}
  </button>
);

const SectionLabel = ({
  children,
  color = "#A89F92",
}: {
  children: string;
  color?: string;
}) => (
  <div
    className="mb-2 text-[11.5px] font-extrabold uppercase tracking-[0.4px]"
    style={{ color }}
  >
    {children}
  </div>
);

interface ReorderProps {
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
}

/** Shared card footer: horizontal reorder controls on the left, labeled delete on the right. */
const ActionBar = ({
  reorder,
  onDelete,
}: {
  reorder: ReorderProps;
  onDelete: () => void;
}) => (
  <div className="mt-[10px] flex items-center justify-between border-t border-[#efe7da] pt-[10px]">
    <ReorderControls {...reorder} />
    <button
      type="button"
      onClick={onDelete}
      aria-label="Delete"
      className="flex h-10 shrink-0 cursor-pointer items-center gap-[6px] rounded-[11px] bg-[#fbeeec] px-[14px] text-[13.5px] font-bold text-[#b4453a] transition touch-manipulation hover:bg-[#f7e2df] active:scale-95"
    >
      <Trash2 size={16} />
      Delete
    </button>
  </div>
);

export function DaysTab({
  trip,
  dayIndex,
  onSelectDay,
  onPrevDay,
  onNextDay,
  update,
  onAskAI,
  aiBusyKey,
  hasLanguages,
  translateBusyKey,
  onTranslateItem,
  onTranslateStay,
  onTranslateDay,
}: DaysTabProps) {
  const di = Math.max(0, Math.min(dayIndex, trip.days.length - 1));
  const day = trip.days[di];
  const swipe = useSwipe(onPrevDay, onNextDay);

  return (
    <>
      <div className="mb-3 flex items-center gap-[10px]">
        <NavBtn dir="left" onClick={onPrevDay} />
        <div className="min-w-0 flex-1 text-center">
          <div className="text-[19px] font-extrabold tracking-[-0.3px]">
            {bigDate(day.date)}
          </div>
          <div className="text-[13px] font-semibold text-muted">
            Day {di + 1} of {trip.days.length}
          </div>
        </div>
        <NavBtn dir="right" onClick={onNextDay} />
      </div>

      <div className="mb-4">
        <DayStrip
          days={trip.days}
          current={di}
          today=""
          onSelect={onSelectDay}
          size={48}
          markToday={false}
        />
      </div>

      <div
        onPointerDown={swipe.onPointerDown}
        onPointerMove={swipe.onPointerMove}
        onPointerUp={swipe.onPointerUp}
        onPointerLeave={swipe.onPointerUp}
        className="touch-pan-y"
      >
        <div
          style={{
            transform: `translateX(${swipe.dragX}px)`,
            transition: swipe.dragging
              ? "none"
              : "transform .28s cubic-bezier(.22,.61,.36,1)",
          }}
        >
          {/* Day title */}
          <div className="mb-[14px]">
            <SectionLabel>Day title</SectionLabel>
            <input
              value={day.theme}
              onChange={(e) =>
                update((t) => setDayField(t, di, "theme", e.target.value))
              }
              className={cn(ui.input, "h-12 font-bold text-accent")}
            />
            {hasLanguages && (
              <button
                onClick={() => onTranslateDay(di)}
                disabled={translateBusyKey === `d-${di}`}
                className={cn(
                  "mt-2 flex h-9 items-center gap-[6px] rounded-sm bg-ink px-[12px] py-0 text-[12.5px] font-extrabold text-white touch-manipulation",
                  translateBusyKey === `d-${di}`
                    ? "cursor-default opacity-70"
                    : "cursor-pointer opacity-100",
                )}
              >
                <Sparkles size={14} />
                {translateBusyKey === `d-${di}` ? "Translating…" : "Translate"}
              </button>
            )}
          </div>

          {/* Flights */}
          <SectionLabel color="#1E6FA8">Flights</SectionLabel>
          {(day.flights ?? []).map((f, fi) => (
            <div
              key={fi}
              className="mb-[10px] rounded-md border border-[#d2e3f0] bg-[#eaf2f9] p-[10px]"
            >
              <input
                type="time"
                value={f.time}
                onChange={(e) =>
                  update((t) => updateFlight(t, di, fi, "time", e.target.value))
                }
                aria-label="Flight time"
                className={cn(flightInput, "w-[120px] shrink-0 font-bold")}
              />
              <input
                value={f.flightNo}
                onChange={(e) =>
                  update((t) =>
                    updateFlight(t, di, fi, "flightNo", e.target.value),
                  )
                }
                placeholder="Flight no.…"
                className={cn(flightInput, "mt-2 w-full font-bold")}
              />
              <div className="mt-2 flex gap-2">
                <input
                  value={f.from}
                  onChange={(e) =>
                    update((t) =>
                      updateFlight(t, di, fi, "from", e.target.value),
                    )
                  }
                  placeholder="From…"
                  className={cn(flightInput, "min-w-0 flex-1 font-semibold")}
                />
                <input
                  value={f.to}
                  onChange={(e) =>
                    update((t) => updateFlight(t, di, fi, "to", e.target.value))
                  }
                  placeholder="To…"
                  className={cn(flightInput, "min-w-0 flex-1 font-semibold")}
                />
              </div>
              <ActionBar
                reorder={{
                  canUp: fi > 0,
                  canDown: fi < (day.flights?.length ?? 0) - 1,
                  onUp: () => update((t) => moveFlight(t, di, fi, fi - 1)),
                  onDown: () => update((t) => moveFlight(t, di, fi, fi + 1)),
                }}
                onDelete={() => update((t) => delFlight(t, di, fi))}
              />
            </div>
          ))}
          <div className="mb-4">
            <AddRow
              label="Add flight"
              color="#2C6E9B"
              onClick={() => update((t) => addFlight(t, di))}
            />
          </div>

          {/* Activities */}
          <SectionLabel>Activities</SectionLabel>
          {day.items.map((it, ii) => {
            const busy = aiBusyKey === `${di}-${ii}`;
            return (
              <div key={ii} className={cn(ui.card, "mb-[10px] p-[11px]")}>
                <div className="flex items-center gap-[10px]">
                  {(() => {
                    const thumb = imgFor(it);
                    return thumb ? (
                      <div
                        className="h-11 w-11 shrink-0 rounded-[11px] shadow-[0_2px_6px_rgba(0,0,0,0.12)]"
                        style={{ background: `center/cover url("${thumb}")` }}
                      />
                    ) : (
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] border border-dashed border-border bg-surface text-faint"
                        aria-hidden="true"
                      >
                        <ImageIcon size={18} strokeWidth={2} />
                      </div>
                    );
                  })()}
                  <input
                    type="time"
                    value={it.time}
                    onChange={(e) =>
                      update((t) =>
                        updateItem(t, di, ii, "time", e.target.value),
                      )
                    }
                    aria-label="Activity time"
                    className={cn(fieldInput, "w-[120px] shrink-0 font-bold")}
                  />
                </div>
                <input
                  value={it.title}
                  onChange={(e) =>
                    update((t) =>
                      updateItem(t, di, ii, "title", e.target.value),
                    )
                  }
                  aria-label="Activity title"
                  placeholder="Title…"
                  className={cn(
                    fieldInput,
                    "mt-2 w-full text-[15px] font-semibold",
                  )}
                />
                <textarea
                  value={it.note ?? ""}
                  onChange={(e) =>
                    update((t) =>
                      setItemContent(t, di, ii, { note: e.target.value }),
                    )
                  }
                  placeholder="Description…"
                  className="mt-2 min-h-[54px] w-full resize-y rounded-sm border border-[#e7dfd2] px-[10px] py-2 text-[13.5px] font-medium leading-[1.45] text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                />
                <input
                  value={it.tip ?? ""}
                  onChange={(e) =>
                    update((t) =>
                      setItemContent(t, di, ii, { tip: e.target.value }),
                    )
                  }
                  aria-label="Tip"
                  placeholder="Tip (amber callout)…"
                  className={cn(
                    fieldInput,
                    "mt-2 w-full text-[13.5px] font-medium",
                  )}
                />
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="url"
                    inputMode="url"
                    value={it.image ?? ""}
                    onChange={(e) =>
                      update((t) =>
                        setItemContent(t, di, ii, { image: e.target.value }),
                      )
                    }
                    aria-label="Image URL"
                    placeholder="Image URL…"
                    className={cn(
                      fieldInput,
                      "min-w-0 flex-1 text-[13px] font-semibold",
                    )}
                  />
                  <button
                    onClick={() => onAskAI(di, ii)}
                    disabled={busy}
                    className={cn(
                      "flex h-11 shrink-0 items-center gap-[6px] rounded-sm bg-ink px-[14px] py-0 text-[13.5px] font-extrabold text-white touch-manipulation",
                      busy
                        ? "cursor-default opacity-70"
                        : "cursor-pointer opacity-100",
                    )}
                  >
                    <Sparkles size={16} />
                    {busy ? "Generating…" : "Ask AI"}
                  </button>
                  {hasLanguages && (
                    <button
                      onClick={() => onTranslateItem(di, ii)}
                      disabled={translateBusyKey === `i-${di}-${ii}`}
                      className={cn(
                        "flex h-11 shrink-0 items-center gap-[6px] rounded-sm border border-ink bg-transparent px-[12px] py-0 text-[13px] font-extrabold text-ink touch-manipulation",
                        translateBusyKey === `i-${di}-${ii}`
                          ? "cursor-default opacity-50"
                          : "cursor-pointer opacity-100",
                      )}
                    >
                      <Sparkles size={15} />
                      {translateBusyKey === `i-${di}-${ii}`
                        ? "Translating…"
                        : "Translate"}
                    </button>
                  )}
                </div>
                <ActionBar
                  reorder={{
                    canUp: ii > 0,
                    canDown: ii < day.items.length - 1,
                    onUp: () => update((t) => moveItem(t, di, ii, ii - 1)),
                    onDown: () => update((t) => moveItem(t, di, ii, ii + 1)),
                  }}
                  onDelete={() => update((t) => delItem(t, di, ii))}
                />
              </div>
            );
          })}
          <div className="mt-[2px]">
            <AddRow
              label="Add activity"
              color="#8A8175"
              onClick={() => update((t) => addItem(t, di))}
            />
          </div>

          {/* Accommodation */}
          <div className="mb-2 mt-4">
            <SectionLabel color="#3B5B8C">Accommodation</SectionLabel>
          </div>
          <div className="flex items-center gap-[10px] rounded-md border border-[#dce5f0] bg-[#eef2f8] p-[11px]">
            <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-stay">
              <BedDouble size={20} color="#fff" strokeWidth={2} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
              <input
                value={day.stay?.name ?? ""}
                onChange={(e) =>
                  update((t) => updateStay(t, di, "name", e.target.value))
                }
                placeholder="Hotel name…"
                className={cn(
                  fieldInput,
                  "h-[38px] w-full border-[#cfdaea] text-[14.5px] font-bold",
                )}
              />
              <input
                value={day.stay?.desc ?? ""}
                onChange={(e) =>
                  update((t) => updateStay(t, di, "desc", e.target.value))
                }
                placeholder="Short description…"
                className={cn(
                  fieldInput,
                  "h-[38px] w-full border-[#cfdaea] text-[13.5px] font-medium",
                )}
              />
            </div>
          </div>
          {hasLanguages && day.stay?.name && (
            <button
              onClick={() => onTranslateStay(di)}
              disabled={translateBusyKey === `s-${di}`}
              className={cn(
                "mt-2 flex h-9 items-center gap-[6px] rounded-sm bg-ink px-[12px] py-0 text-[12.5px] font-extrabold text-white touch-manipulation",
                translateBusyKey === `s-${di}`
                  ? "cursor-default opacity-70"
                  : "cursor-pointer opacity-100",
              )}
            >
              <Sparkles size={14} />
              {translateBusyKey === `s-${di}` ? "Translating…" : "Translate"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
