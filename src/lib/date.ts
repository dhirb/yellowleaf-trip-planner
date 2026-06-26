/** Date helpers, ported from the prototype logic. All dates are ISO "YYYY-MM-DD". */

const pad = (n: number): string => String(n).padStart(2, "0");

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
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000);
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
  const m = (d: Date): string => d.toLocaleDateString("en-US", { month: "short" });
  if (m(a) === m(b)) return `${a.getDate()}–${b.getDate()} ${m(b)}`;
  return `${a.getDate()} ${m(a)} – ${b.getDate()} ${m(b)}`;
}
