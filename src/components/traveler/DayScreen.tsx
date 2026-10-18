import { useRef } from "react";
import type { Trip } from "../../types";
import type { AirportIndex } from "../../lib/airports";
import type { TimeFormat } from "../../lib/date";
import { SwipePager } from "../ui/SwipePager";
import { DayView } from "./DayView";

interface DayScreenProps {
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
  onOpenDayMap: (dayIndex: number) => void;
  airports: AirportIndex | null;
}

/**
 * Horizontal day pager. A thin wrapper over {@link SwipePager} that renders one
 * {@link DayView} per panel, so a neighbouring day previews in from the edge
 * while you drag and settles onto it once the swipe passes the threshold.
 */
export function DayScreen({
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
}: DayScreenProps) {
  // One strip offset for all panels, so picking a day never visibly re-scrolls
  // the strip (each panel mounts its own DayStrip instance).
  const stripScroll = useRef(0);

  return (
    <SwipePager
      index={dayIndex}
      count={trip.days.length}
      onPrev={onPrevDay}
      onNext={onNextDay}
      className="bg-app-bg"
      renderPanel={(i) => (
        <DayView
          trip={trip}
          dayIndex={i}
          today={today}
          lang={lang}
          timeFormat={timeFormat}
          onSelectDay={onSelectDay}
          onPrevDay={onPrevDay}
          onNextDay={onNextDay}
          onOpenItem={onOpenItem}
          onOpenFlight={onOpenFlight}
          onOpenStay={onOpenStay}
          onOpenRouteMap={onOpenRouteMap}
          onOpenDayMap={() => onOpenDayMap(i)}
          airports={airports}
          stripScroll={stripScroll}
          stripActive={i === dayIndex}
        />
      )}
    />
  );
}
