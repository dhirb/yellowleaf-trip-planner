import type { DayTranslation, Trip } from "../../types";
import { bigDate, type TimeFormat } from "../../lib/date";
import { buildViewItems } from "../../lib/dayView";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSwipe } from "../../hooks/useSwipe";
import { DayStrip } from "../traveler/DayStrip";
import { ActivityCard } from "../traveler/ActivityCard";
import { FlightCard } from "../traveler/FlightCard";
import { StayCard } from "../traveler/StayCard";
import { AddRow } from "../ui/AddRow";
import { ReorderControls } from "../ui/ReorderControls";
import { TranslatableField } from "./TranslatableField";
import { translateField } from "../../lib/ai";
import {
  addFlight,
  addItem,
  moveFlight,
  moveItem,
  setDayField,
  setDayTranslations,
} from "../../lib/editTrip";

interface DaysTabProps {
  trip: Trip;
  dayIndex: number;
  onSelectDay: (i: number) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  update: (updater: (t: Trip) => Trip) => void;
  onOpenItem: (di: number, ii: number) => void;
  onOpenFlight: (di: number, fi: number) => void;
  onOpenStay: (di: number) => void;
}

// Admin cards mirror the traveler view; native time inputs in the edit screens
// are format-agnostic, so a fixed 24h display here is all that's needed.
const ADMIN_TIME_FORMAT: TimeFormat = "24h";

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

/** Vertical reorder column shown in a card's trailing slot (admin list). */
const ReorderTrailing = (props: {
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
}) => <ReorderControls orientation="vertical" {...props} />;

export function DaysTab({
  trip,
  dayIndex,
  onSelectDay,
  onPrevDay,
  onNextDay,
  update,
  onOpenItem,
  onOpenFlight,
  onOpenStay,
}: DaysTabProps) {
  const di = Math.max(0, Math.min(dayIndex, trip.days.length - 1));
  const day = trip.days[di];
  const swipe = useSwipe(onPrevDay, onNextDay);

  const langs = trip.languages ?? [];
  const flights = day.flights ?? [];
  const viewItems = buildViewItems(day, "en");
  const stay = day.stay;

  const setThemeTrans = (code: string, value: string) =>
    update((t) =>
      setDayTranslations(t, di, {
        [code]: { theme: value } as DayTranslation,
      }),
    );

  const translateTheme = async () => {
    const map = await translateField("theme", day.theme, langs);
    update((t) =>
      setDayTranslations(
        t,
        di,
        Object.fromEntries(
          Object.entries(map).map(([code, v]) => [
            code,
            { theme: v } as DayTranslation,
          ]),
        ),
      ),
    );
  };

  const addFlightAndOpen = () => {
    const newIndex = flights.length;
    update((t) => addFlight(t, di));
    onOpenFlight(di, newIndex);
  };

  const addItemAndOpen = () => {
    const newIndex = day.items.length;
    update((t) => addItem(t, di));
    onOpenItem(di, newIndex);
  };

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
            <TranslatableField
              label="Day title"
              value={day.theme}
              onChange={(v) => update((t) => setDayField(t, di, "theme", v))}
              langs={langs}
              translations={day.t}
              field="theme"
              onChangeTranslation={setThemeTrans}
              onTranslate={translateTheme}
              placeholder="Day title…"
            />
          </div>

          {/* Flights */}
          <SectionLabel color="#1E6FA8">Flights</SectionLabel>
          {flights.map((f, fi) => (
            <FlightCard
              key={fi}
              flight={f}
              timeFormat={ADMIN_TIME_FORMAT}
              onOpen={() => onOpenFlight(di, fi)}
              trailing={
                <ReorderTrailing
                  canUp={fi > 0}
                  canDown={fi < flights.length - 1}
                  onUp={() => update((t) => moveFlight(t, di, fi, fi - 1))}
                  onDown={() => update((t) => moveFlight(t, di, fi, fi + 1))}
                />
              }
            />
          ))}
          <div className="mb-4">
            <AddRow
              label="Add flight"
              color="#2C6E9B"
              onClick={addFlightAndOpen}
            />
          </div>

          {/* Activities */}
          <SectionLabel>Activities</SectionLabel>
          {viewItems.map((vi) => (
            <ActivityCard
              key={vi.index}
              view={vi}
              timeFormat={ADMIN_TIME_FORMAT}
              onOpen={() => onOpenItem(di, vi.index)}
              trailing={
                <ReorderTrailing
                  canUp={vi.index > 0}
                  canDown={vi.index < viewItems.length - 1}
                  onUp={() =>
                    update((t) => moveItem(t, di, vi.index, vi.index - 1))
                  }
                  onDown={() =>
                    update((t) => moveItem(t, di, vi.index, vi.index + 1))
                  }
                />
              }
            />
          ))}
          <div className="mt-[2px]">
            <AddRow
              label="Add activity"
              color="#8A8175"
              onClick={addItemAndOpen}
            />
          </div>

          {/* Accommodation */}
          <div className="mb-2 mt-4">
            <SectionLabel color="#3B5B8C">Accommodation</SectionLabel>
          </div>
          {stay?.name ? (
            <StayCard
              name={stay.name}
              sub={stay.desc ?? stay.note ?? ""}
              onOpen={() => onOpenStay(di)}
            />
          ) : (
            <AddRow
              label="Add accommodation"
              color="#3B5B8C"
              onClick={() => onOpenStay(di)}
            />
          )}
        </div>
      </div>
    </>
  );
}
