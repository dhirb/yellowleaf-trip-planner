import { useMemo } from "react";
import type { Trip } from "../../types";
import type { AirportIndex } from "../../lib/airports";
import { bigDate } from "../../lib/date";
import { localizeDayTheme } from "../../lib/localize";
import { dayPins } from "../../lib/mapPins";
import { MapShell } from "./MapShell";
import { PinMap } from "./PinMap";

interface DayMapScreenProps {
  trip: Trip;
  dayIndex: number;
  lang: string;
  airports: AirportIndex | null;
  onBack: () => void;
  /** A tapped pin, by its id (see `dayPins`) — opens that card's detail. */
  onOpenPin: (id: string) => void;
}

/**
 * Full-screen map of one day: every located activity, the local airport of
 * any flight, and the night's accommodation, each labelled. Tapping a pin
 * opens the same detail page as tapping its card.
 */
export function DayMapScreen({
  trip,
  dayIndex,
  lang,
  airports,
  onBack,
  onOpenPin,
}: DayMapScreenProps) {
  const day = trip.days[dayIndex];
  const pins = useMemo(
    () => dayPins(trip, dayIndex, lang, airports),
    [trip, dayIndex, lang, airports],
  );

  return (
    <MapShell
      title={bigDate(day.date)}
      sub={localizeDayTheme(day, lang)}
      onBack={onBack}
      testId="day-map-screen"
    >
      <PinMap
        pins={pins}
        labels
        onSelect={onOpenPin}
        ariaLabel={`Map of ${bigDate(day.date)}`}
      />
    </MapShell>
  );
}
