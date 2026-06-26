import type { Currency, Trip } from "../types";

/** All distinct currencies used across a trip (trip default + per-day overrides). */
export function collectCurrencies(trip: Trip): Currency[] {
  const all = [trip.currency, ...trip.days.map((d) => d.currency).filter(Boolean)] as Currency[];
  const seen: Currency[] = [];
  for (const c of all) {
    if (c && !seen.some((x) => x.code === c.code)) seen.push(c);
  }
  return seen;
}

/** Convert a local amount to the home currency, formatted to 2 dp. */
export function toHome(amount: number, cur: Currency): string {
  return (amount / cur.perHome).toFixed(2);
}

/** "A$1 ≈ ¥98 · JPY" */
export function rateLine(cur: Currency): string {
  return `${cur.homeSymbol}1 ≈ ${cur.symbol}${cur.perHome}  ·  ${cur.code}`;
}
