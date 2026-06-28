import type { ViewItem } from "../../lib/dayView";
import type { TimeFormat } from "../../lib/date";
import { ActivityCard } from "./ActivityCard";

interface DayItemsProps {
  items: ViewItem[];
  timeFormat: TimeFormat;
  onOpen: (index: number) => void;
}

/** Renders a day's activities as a list of cards. */
export function DayItems({ items, timeFormat, onOpen }: DayItemsProps) {
  if (items.length === 0) {
    return (
      <div className="px-1 py-[26px] text-center text-[15px] font-semibold text-faint">
        Nothing planned for this day yet.
      </div>
    );
  }

  return (
    <>
      {items.map((vi) => (
        <ActivityCard
          key={vi.index}
          view={vi}
          timeFormat={timeFormat}
          onOpen={() => onOpen(vi.index)}
        />
      ))}
    </>
  );
}
