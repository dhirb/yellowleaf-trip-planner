import { useMemo, type RefObject } from "react";
import type { Trip } from "../../types";
import type { AirportIndex } from "../../lib/airports";
import { bigDate, type TimeFormat } from "../../lib/date";
import { buildViewItems } from "../../lib/dayView";
import { localizeStay, localizeDayTheme } from "../../lib/localize";
import { dayPins, routePins } from "../../lib/mapPins";
import { stayForDate } from "../../lib/stays";
import { ui } from "../../lib/ui";
import { cn } from "../../lib/cn";
import {
  ChevronLeft,
  ChevronRight,
  MapPinned,
  Route as RouteIcon,
} from "lucide-react";
import { DayStrip } from "./DayStrip";
import { DayItems } from "./DayItems";
import { FlightCard } from "./FlightCard";
import { MapCard } from "./MapCard";
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
  onOpenRouteMap: () => void;
  onOpenDayMap: () => void;
  /** Airport lookup for flight pins; null until loaded (or when offline). */
  airports: AirportIndex | null;
  /** Day-strip offset shared across the pager's panels (see DayStrip). */
  stripScroll?: RefObject<number>;
  /** Whether this panel is the one on screen. */
  stripActive?: boolean;
}

/** Heights (px) of the in-page map cards. */
const ROUTE_MAP_HEIGHT = 220;
const DAY_MAP_HEIGHT = 190;

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
  onOpenRouteMap,
  onOpenDayMap,
  airports,
  stripScroll,
  stripActive,
}: DayViewProps) {
  const day = trip.days[dayIndex] ?? trip.days[0];
  const viewItems = useMemo(() => buildViewItems(day, lang), [day, lang]);

  // The route overview belongs to the first day only — it is the trip's
  // table of contents, not something to repeat on every page.
  const isFirstDay = dayIndex === 0;
  const route = useMemo(
    () => (isFirstDay ? routePins(trip, lang) : []),
    [isFirstDay, trip, lang],
  );
  const pins = useMemo(
    () => dayPins(trip, dayIndex, lang, airports),
    [trip, dayIndex, lang, airports],
  );

  const rawStay = stayForDate(trip.stays, day.date);
  const stay = useMemo(
    () => (rawStay ? localizeStay(rawStay, lang) : null),
    [rawStay, lang],
  );
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
            scrollMemory={stripScroll}
            active={stripActive}
          />
        </div>

        <div className="px-[18px] pt-2 pb-[26px]">
          {route.length > 0 && (
            <MapCard
              title="Your route"
              sub={`${route.length} ${route.length === 1 ? "base" : "bases"} · ${trip.country}`}
              pins={route}
              route
              height={ROUTE_MAP_HEIGHT}
              onExpand={onOpenRouteMap}
              icon={<RouteIcon size={16} strokeWidth={2.4} />}
              testId="route-map"
              active={stripActive ?? true}
            />
          )}
          {pins.length > 0 && (
            <MapCard
              title="Today's map"
              sub={`${pins.length} ${pins.length === 1 ? "place" : "places"}`}
              pins={pins}
              height={DAY_MAP_HEIGHT}
              onExpand={onOpenDayMap}
              icon={<MapPinned size={16} strokeWidth={2.4} />}
              testId="day-map"
              active={stripActive ?? true}
            />
          )}

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
