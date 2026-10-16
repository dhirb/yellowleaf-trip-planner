import type { Day } from "../../types";

/**
 * New days with each day's items in time order. The day files group the fixed
 * plan first and the optional extras after it, which reads well in source but
 * is not how the day runs; `Item.time` is zero-padded "HH:MM", so a plain
 * string compare sorts correctly (the same idiom as `timeInsertIndex` in
 * lib/editTrip.ts). The sort is stable, so equal times keep source order.
 */
export function sortedByTime(days: readonly Day[]): Day[] {
  return days.map((day) => ({
    ...day,
    items: [...day.items].sort((a, b) => a.time.localeCompare(b.time)),
  }));
}
