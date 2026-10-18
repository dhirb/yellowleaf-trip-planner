import { useCallback, useMemo, useState } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import { cn } from "../../lib/cn";
import { fieldInput } from "./editFields";
import { SuggestField } from "../ui/SuggestField";
import {
  loadAirports,
  searchAirports,
  formatAirport,
  type Airport,
} from "../../lib/airports";

interface AirportFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  /** Extra classes merged onto the input face (e.g. font weight, flex sizing). */
  className?: string;
}

const MAX_SUGGESTIONS = 7;
/** Settle time before re-filtering the ~4.5k-row dataset as the admin types. */
const FILTER_DEBOUNCE_MS = 120;

/**
 * A free-text airport input with type-ahead suggestions from the OurAirports
 * dataset. Picking a suggestion fills in the canonical "City (IATA)" label.
 * The dataset loads lazily on first focus, so it costs nothing until someone
 * edits a flight.
 */
export function AirportField({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
}: AirportFieldProps) {
  const [airports, setAirports] = useState<Airport[] | null>(null);

  // Load the dataset once, on first focus.
  const ensureLoaded = useCallback(() => {
    if (airports) return;
    loadAirports()
      .then(setAirports)
      .catch(() => {
        /* offline / fetch failed — the field stays a plain text input */
      });
  }, [airports]);

  // Filter on a debounced copy of the value — the input stays instant, but the
  // full-dataset scan only runs once typing settles.
  const query = useDebounce(value, FILTER_DEBOUNCE_MS);
  const matches = useMemo(
    () => (airports ? searchAirports(airports, query, MAX_SUGGESTIONS) : []),
    [airports, query],
  );

  // A suggestion identical to the current value is noise — hide the menu then.
  const items =
    matches.length === 1 && formatAirport(matches[0]) === value ? [] : matches;

  return (
    <SuggestField
      value={value}
      onChange={onChange}
      onFocus={ensureLoaded}
      items={items}
      itemKey={(a) => a.iata}
      onPick={(a) => onChange(formatAirport(a))}
      renderItem={(a) => (
        <>
          <span className="w-9 shrink-0 text-[12px] font-extrabold text-faint tabular-nums">
            {a.iata}
          </span>
          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">
            {a.city || a.name}
            {a.country && (
              <span className="font-medium text-muted"> · {a.country}</span>
            )}
          </span>
        </>
      )}
      // ODbL/public-domain attribution, shown where the data is used.
      footer="Airport data · OurAirports + OpenFlights"
      placeholder={placeholder}
      ariaLabel={ariaLabel}
      inputClassName={cn(fieldInput, className)}
    />
  );
}
