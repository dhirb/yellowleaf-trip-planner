import { BedDouble, TriangleAlert } from "lucide-react";
import type { Trip } from "../../types";
import { rangeLabel } from "../../lib/date";
import {
  overlappingStayIndices,
  sortedStays,
  stayNights,
  staysOutsideTrip,
} from "../../lib/stays";
import { addStay } from "../../lib/editTrip";
import { cn } from "../../lib/cn";
import { ui } from "../../lib/ui";
import { AddRow } from "../ui/AddRow";

interface StaysTabProps {
  trip: Trip;
  update: (updater: (t: Trip) => Trip) => void;
  onOpenStay: (si: number) => void;
}

/**
 * The trip's accommodation, listed in check-in order. Stays are dated rather
 * than pinned to a day, so a hotel booked for several nights is one entry here
 * and the day editor just reports which one covers it.
 */
export function StaysTab({ trip, update, onOpenStay }: StaysTabProps) {
  const rows = sortedStays(trip.stays);
  const overlapping = overlappingStayIndices(trip.stays);
  const firstDate = trip.days[0].date;
  const lastDate = trip.days[trip.days.length - 1].date;

  // `addStay` appends, so the new stay's index is the current length — the list
  // is only sorted for display. Mirrors addItemAndOpen/addFlightAndOpen.
  const addStayAndOpen = () => {
    const newIndex = trip.stays.length;
    update(addStay);
    onOpenStay(newIndex);
  };

  return (
    <>
      <div className="mb-3 px-1 text-[13.5px] font-medium leading-[1.45] text-muted">
        Each stay covers the nights from check-in up to — but not including —
        check-out. Travelers see it on every day it covers.
      </div>

      {rows.length === 0 && (
        <div className="mb-3 rounded-lg border border-dashed border-border-strong px-4 py-6 text-center text-[14px] font-semibold text-faint">
          No accommodation yet.
        </div>
      )}

      {rows.map(({ stay, index }) => {
        const nights = stayNights(stay);
        const stranded = staysOutsideTrip(stay, firstDate, lastDate);
        return (
          <button
            key={index}
            onClick={() => onOpenStay(index)}
            className={cn(ui.cardRow, "w-full text-left")}
          >
            <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-md bg-stay">
              <BedDouble size={20} color="#fff" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-lead font-bold">{stay.name}</div>
              <div className="mt-px text-small font-semibold text-muted">
                {rangeLabel(stay.checkIn, stay.checkOut)} · {nights}{" "}
                {nights === 1 ? "night" : "nights"}
              </div>
              {(overlapping.has(index) || stranded) && (
                <div className="mt-[5px] flex items-center gap-[5px] text-small font-bold text-danger">
                  <TriangleAlert size={13} strokeWidth={2.6} />
                  {stranded
                    ? "Outside the trip's dates"
                    : "Overlaps another stay"}
                </div>
              )}
            </div>
          </button>
        );
      })}

      <div className="mt-[2px]">
        <AddRow
          label="Add accommodation"
          color="#3B5B8C"
          onClick={addStayAndOpen}
        />
      </div>
    </>
  );
}
