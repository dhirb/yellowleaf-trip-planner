/** Date helpers, ported from the prototype logic. All dates are ISO "YYYY-MM-DD". */

const pad = (n: number): string => String(n).padStart(2, "0");

/** Traveler-facing clock preference. */
export type TimeFormat = "24h" | "12h";

/**
 * Format an "HH:mm" time string for display. Times are authored as free text,
 * so anything that isn't a valid 24-hour clock value is returned untouched.
 */
export function formatTime(time: string, fmt: TimeFormat): string {
  const m = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return time;

  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return time;

  if (fmt === "24h") return time;

  const meridiem = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m[2]} ${meridiem}`;
}

/**
 * Format an "HH:mm" duration (as entered via a time input) as "1h 30m". Whole
 * hours drop the minutes ("2h"); sub-hour durations drop the hours ("45m").
 * Anything that isn't a valid clock value is returned untouched, so legacy
 * free-text durations like "2h 15m" still display as authored.
 */
export function formatDuration(value: string): string {
  const m = value.match(/^(\d{1,3}):(\d{2})$/);
  if (!m) return value;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (min > 59) return value;
  const parts: string[] = [];
  if (h) parts.push(`${h}h`);
  if (min) parts.push(`${min}m`);
  return parts.join(" ") || "0m";
}

/** Today's date as an ISO string in local time. */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse an ISO date into a local-midnight Date (avoids UTC off-by-one). */
export function parseISO(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

/** Add `n` days to an ISO date, returning a new ISO string. */
export function addDays(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Whole days from `a` to `b` (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round(
    (parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000,
  );
}

/** Day-of-month number for an ISO date. */
export function dayOfMonth(iso: string): number {
  return parseISO(iso).getDate();
}

/** Format an ISO date with Intl options. */
export function fmt(iso: string, opt: Intl.DateTimeFormatOptions): string {
  return parseISO(iso).toLocaleDateString("en-US", opt);
}

/** A compact human label like "Wed 24 Jun". */
export function bigDate(iso: string): string {
  return `${fmt(iso, { weekday: "short" })} ${dayOfMonth(iso)} ${fmt(iso, { month: "short" })}`;
}

/** A trip date-range label like "24–29 Jun" or "30 Jun – 2 Jul". */
export function rangeLabel(startIso: string, endIso: string): string {
  const a = parseISO(startIso);
  const b = parseISO(endIso);
  const m = (d: Date): string =>
    d.toLocaleDateString("en-US", { month: "short" });
  if (m(a) === m(b)) return `${a.getDate()}–${b.getDate()} ${m(b)}`;
  return `${a.getDate()} ${m(a)} – ${b.getDate()} ${m(b)}`;
}
