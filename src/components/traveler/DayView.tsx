import type { Trip } from "../../types";
import { bigDate, type TimeFormat } from "../../lib/date";
import { buildViewItems } from "../../lib/dayView";
import { localizeStay, localizeDayTheme } from "../../lib/localize";
import { ui } from "../../lib/ui";
import { cn } from "../../lib/cn";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayStrip } from "./DayStrip";
import { DayItems } from "./DayItems";
import { FlightCard } from "./FlightCard";
import { StayCard } from "./StayCard";

interface DayViewProps {
  trip: Trip;
  dayIndex: number;
  today: string;
  lang: string;
  timeFormat: TimeFormat;
  onSelectDay: (i: number) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onOpenItem: (index: number) => void;
  onOpenFlight: (index: number) => void;
  onOpenStay: () => void;
}

const NavBtn = ({
  dir,
  onClick,
}: {
  dir: "left" | "right";
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={ui.chevBtn}
    aria-label={dir === "left" ? "Previous day" : "Next day"}
  >
    {dir === "left" ? (
      <ChevronLeft size={22} color="#7A6F60" strokeWidth={2.6} />
    ) : (
      <ChevronRight size={22} color="#7A6F60" strokeWidth={2.6} />
    )}
  </button>
);

/** A single day's full screen (header + scrollable body). One carousel panel. */
export function DayView({
  trip,
  dayIndex,
  today,
  lang,
  timeFormat,
  onSelectDay,
  onPrevDay,
  onNextDay,
  onOpenItem,
  onOpenFlight,
  onOpenStay,
}: DayViewProps) {
  const day = trip.days[dayIndex] ?? trip.days[0];
  const viewItems = buildViewItems(day, lang);

  const rawStay = day.stay ?? trip.hotel;
  const stay = rawStay ? localizeStay(rawStay, lang) : null;
  const stayName = stay?.name ?? "";
  const staySub = stay?.desc ?? stay?.note ?? "";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn(ui.header, "pb-3")}>
        <div className="mb-4 flex items-center gap-3">
          <div className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-lead font-extrabold tracking-[-0.2px]">
            {trip.title}
          </div>
          <div className="shrink-0 text-small font-bold text-muted tabular-nums">
            Day {dayIndex + 1} of {trip.days.length}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NavBtn dir="left" onClick={onPrevDay} />
          <div className="min-w-0 flex-1 text-center">
            <div className="text-display font-extrabold tracking-[-0.6px]">
              {bigDate(day.date)}
            </div>
            <div className="mt-[2px] text-small font-semibold text-muted">
              {localizeDayTheme(day, lang)}
            </div>
          </div>
          <NavBtn dir="right" onClick={onNextDay} />
        </div>
      </div>

      <div className={cn("no-scrollbar", ui.body)}>
        {/* The day strip scrolls with the content rather than staying pinned in
            the header. It's its own horizontal scroller, so keep its gestures
            local so it doesn't fight the carousel drag. */}
        <div
          className="mx-4 mt-2"
          style={{ touchAction: "pan-x" }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <DayStrip
            days={trip.days}
            current={dayIndex}
            today={today}
            onSelect={onSelectDay}
          />
        </div>

        <div className="px-[18px] pt-2 pb-[26px]">
          {/* Flights */}
          {(day.flights ?? []).map((f, i) => (
            <FlightCard
              key={i}
              flight={f}
              timeFormat={timeFormat}
              onOpen={() => onOpenFlight(i)}
            />
          ))}

          <DayItems
            items={viewItems}
            timeFormat={timeFormat}
            onOpen={onOpenItem}
          />

          {/* Accommodation */}
          {stayName && (
            <StayCard name={stayName} sub={staySub} onOpen={onOpenStay} />
          )}
        </div>
      </div>
    </div>
  );
}
