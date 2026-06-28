import { cn } from "../../lib/cn";
import { fieldInput } from "./editFields";

interface DurationFieldProps {
  /** Stored as "H:MM" (hours unbounded, minutes 0–59) or "" when unset. */
  value: string;
  onChange: (value: string) => void;
  /** Base label; the two inputs get " hours"/" minutes" suffixes. */
  ariaLabel: string;
  className?: string;
}

/** Split a stored "H:MM" value into display strings (blank when unset/invalid). */
function split(value: string): { h: string; m: string } {
  const match = value.match(/^(\d+):(\d{2})$/);
  if (!match) return { h: "", m: "" };
  return { h: String(Number(match[1])), m: String(Number(match[2])) };
}

/**
 * A duration picker for layovers — separate hours and minutes inputs rather than
 * a native `<input type="time">`. Unlike the native control it never shows
 * AM/PM (it's elapsed time, not a clock) and has no 24-hour ceiling, so a long
 * connection like "30h 15m" is expressible. Stored as "H:MM"; a zero duration
 * collapses to "" so an empty pair clears the field.
 */
export function DurationField({
  value,
  onChange,
  ariaLabel,
  className,
}: DurationFieldProps) {
  const { h, m } = split(value);

  const emit = (hours: string, minutes: string) => {
    const H = Number(hours.replace(/\D/g, "") || 0);
    const M = Math.min(59, Number(minutes.replace(/\D/g, "") || 0));
    onChange(H === 0 && M === 0 ? "" : `${H}:${String(M).padStart(2, "0")}`);
  };

  const cell = cn(fieldInput, "w-[48px] px-1 text-center font-bold");

  return (
    <div className={cn("flex shrink-0 items-center gap-1", className)}>
      <input
        inputMode="numeric"
        value={h}
        onChange={(e) => emit(e.target.value, m)}
        aria-label={`${ariaLabel} hours`}
        placeholder="0"
        maxLength={3}
        className={cell}
      />
      <span className="text-[13px] font-semibold text-faint">h</span>
      <input
        inputMode="numeric"
        value={m}
        onChange={(e) => emit(h, e.target.value)}
        aria-label={`${ariaLabel} minutes`}
        placeholder="00"
        maxLength={2}
        className={cell}
      />
      <span className="text-[13px] font-semibold text-faint">m</span>
    </div>
  );
}
