import type { Trip } from "../../types";
import { SwipePager } from "../ui/SwipePager";
import { AdminDayView } from "./AdminDayView";

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

/**
 * Admin day editor pager. Like the traveler {@link DayScreen}, it renders one
 * {@link AdminDayView} per panel through {@link SwipePager} so the whole page —
 * header, day strip, and content — swipes, previewing the neighbouring day in
 * from the edge mid-drag.
 */
export function DaysTab(props: DaysTabProps) {
  const { trip, dayIndex, onPrevDay, onNextDay } = props;
  const di = Math.max(0, Math.min(dayIndex, trip.days.length - 1));

  return (
    <SwipePager
      index={di}
      count={trip.days.length}
      onPrev={onPrevDay}
      onNext={onNextDay}
      renderPanel={(i) => <AdminDayView {...props} dayIndex={i} />}
    />
  );
}
