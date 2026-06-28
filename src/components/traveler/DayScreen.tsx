import type { Trip } from "../../types";
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
}: DayScreenProps) {
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
        />
      )}
    />
  );
}
