import type { ReactNode } from "react";
import type { Flight } from "../../types";
import { formatTime, type TimeFormat } from "../../lib/date";
import { cn } from "../../lib/cn";
import { Plane } from "lucide-react";

interface FlightCardProps {
  flight: Flight;
  timeFormat: TimeFormat;
  /** When provided the card becomes a tappable button (admin edit). */
  onOpen?: () => void;
  /** Extra classes for the card face (e.g. `mb-0` when wrapped in a list row). */
  className?: string;
  /** Trailing controls (e.g. reorder buttons) shown beside the tap area. */
  trailing?: ReactNode;
}

const BASE =
  "mb-[14px] flex items-center gap-[14px] rounded-lg border border-[#d2e3f0] bg-[#eaf2f9] p-[15px]";

/**
 * A single flight card. Shared by the traveler day view (static `div`) and the
 * admin day editor (tappable `button` via `onOpen`); the inner markup is
 * identical so the two surfaces look the same.
 */
export function FlightCard({
  flight,
  timeFormat,
  onOpen,
  className,
  trailing,
}: FlightCardProps) {
  const stops = flight.layovers?.length ?? 0;
  const dep = flight.depTime ? formatTime(flight.depTime, timeFormat) : "";
  const arr = flight.arrTime ? formatTime(flight.arrTime, timeFormat) : "";
  const headline =
    dep && arr
      ? `${dep} → ${arr}`
      : dep
        ? `Departs ${dep}`
        : arr
          ? `Arrives ${arr}`
          : "";
  const inner = (
    <>
      <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-md bg-flight shadow-[0_5px_12px_rgba(30,111,168,0.28)]">
        <Plane size={22} color="#fff" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-caption font-extrabold uppercase tracking-[0.4px] text-[#2c6e9b]">
          Flight · {flight.flightNo}
        </div>
        {headline && (
          <div className="my-[2px] text-subtitle font-extrabold tracking-[-0.2px] tabular-nums">
            {headline}
          </div>
        )}
        <div className="text-small font-semibold text-[#5c7c92]">
          {flight.from} &nbsp;→&nbsp; {flight.to}
          {stops > 0 && (
            <span className="text-[#7c95a6]">
              {" · "}
              {stops} stop{stops > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (trailing !== undefined) {
    return (
      <div className={cn(BASE, className)}>
        <button
          onClick={onOpen}
          className="flex min-w-0 flex-1 items-center gap-[14px] text-left"
        >
          {inner}
        </button>
        {trailing}
      </div>
    );
  }

  if (onOpen) {
    return (
      <button
        onClick={onOpen}
        className={cn(BASE, "w-full text-left", className)}
      >
        {inner}
      </button>
    );
  }
  return <div className={cn(BASE, className)}>{inner}</div>;
}
