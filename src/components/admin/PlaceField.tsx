import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/cn";
import { searchPlaces, type Place, type PlaceScope } from "../../lib/geocode";
import { fieldInput } from "./editFields";
import { SuggestField } from "../ui/SuggestField";

interface PlaceFieldProps {
  /** The search text (for a stay, its city label). */
  value: string;
  /** Free typing edits the text only; nothing is looked up until Find. */
  onChangeText: (value: string) => void;
  /** Picking a result is what sets the pin. */
  onPick: (place: Place) => void;
  scope: PlaceScope;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}

/** Fewer characters than this is too vague to ask the geocoder about. */
const MIN_QUERY_CHARS = 2;

type Status = "idle" | "short" | "searching" | "empty" | "failed";

const STATUS_COPY: Record<Exclude<Status, "idle">, string> = {
  short: "Type at least two characters to search.",
  searching: "Searching OpenStreetMap…",
  empty: "No places found — try adding the town or country.",
  failed: "Couldn't reach OpenStreetMap. Check the connection and try again.",
};

/**
 * Place search backed by OpenStreetMap's geocoder, run only on an explicit
 * Find (button or Enter): the public Nominatim instance forbids
 * search-as-you-type, and one request per lookup is well inside its limits.
 * Results open as a menu; picking one hands the place to `onPick`.
 */
export function PlaceField({
  value,
  onChangeText,
  onPick,
  scope,
  placeholder,
  ariaLabel,
  className,
}: PlaceFieldProps) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const inFlight = useRef<AbortController | null>(null);

  // Drop an in-flight lookup if the editor closes before it answers.
  useEffect(() => () => inFlight.current?.abort(), []);

  const find = () => {
    if (status === "searching") return;
    const q = value.trim();
    if (q.length < MIN_QUERY_CHARS) {
      setStatus("short");
      return;
    }
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    setStatus("searching");
    searchPlaces(q, scope, controller.signal).then((found) => {
      if (controller.signal.aborted) return;
      setPlaces(found ?? []);
      setStatus(found === null ? "failed" : found.length ? "idle" : "empty");
    });
  };

  return (
    <>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <SuggestField
            value={value}
            onChange={(v) => {
              onChangeText(v);
              // Results belong to the text that was searched; once it changes
              // they would pin the wrong place from under a fresh Enter.
              setPlaces([]);
              setStatus("idle");
            }}
            onSubmit={find}
            items={places}
            itemKey={(p) => `${p.lat},${p.lng}`}
            onPick={(p) => {
              setPlaces([]);
              onPick(p);
            }}
            renderItem={(p) => (
              <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">
                {p.name}
                {p.label !== p.name && (
                  <span className="font-medium text-muted">
                    {" "}
                    · {p.label.slice(p.name.length + 2)}
                  </span>
                )}
              </span>
            )}
            // ODbL attribution, shown where the data is used.
            footer="Search by OpenStreetMap · Nominatim"
            placeholder={placeholder}
            ariaLabel={ariaLabel}
            inputClassName={cn(fieldInput, className)}
          />
        </div>
        <button
          type="button"
          onClick={find}
          disabled={status === "searching"}
          className={cn(
            "h-12 shrink-0 rounded-sm bg-ink px-4 text-[14px] font-extrabold text-app-bg touch-manipulation",
            status === "searching"
              ? "cursor-default opacity-70"
              : "cursor-pointer",
          )}
        >
          Find
        </button>
      </div>
      {status !== "idle" && (
        <div
          role="status"
          className="mt-[6px] text-[12.5px] font-semibold text-faint"
        >
          {STATUS_COPY[status]}
        </div>
      )}
    </>
  );
}
