import { Plane } from "lucide-react";
import type { Flight } from "../../types";
import { formatDuration, formatTime, type TimeFormat } from "../../lib/date";
import { DetailShell } from "./DetailShell";

/**
 * Full-page flight detail, opened by tapping a flight card in the day view.
 * Shows the route, time, any connecting layovers, and the optional note —
 * the flight equivalent of {@link DetailScreen}.
 */
export function FlightDetailScreen({
  flight,
  timeFormat,
  onBack,
}: {
  flight: Flight;
  timeFormat: TimeFormat;
  onBack: () => void;
}) {
  const layovers = flight.layovers ?? [];
  const dep = flight.depTime ? formatTime(flight.depTime, timeFormat) : "";
  const arr = flight.arrTime ? formatTime(flight.arrTime, timeFormat) : "";

  return (
    <DetailShell title="Flight" onBack={onBack}>
      <div className="mb-4 flex h-[58px] w-[58px] items-center justify-center rounded-lg bg-flight shadow-[0_5px_12px_rgba(30,111,168,0.28)]">
        <Plane size={28} color="#fff" strokeWidth={2} />
      </div>

      {flight.flightNo && (
        <div className="text-caption font-extrabold uppercase tracking-[0.4px] text-flight">
          Flight · {flight.flightNo}
        </div>
      )}
      <div className="mt-[2px] mb-2 text-display font-extrabold tracking-[-0.4px] [text-wrap:pretty]">
        {flight.from} &nbsp;→&nbsp; {flight.to}
      </div>

      {(dep || arr) && (
        <div className="flex gap-[10px]">
          {dep && (
            <div className="flex-1 rounded-md border border-border bg-surface px-4 py-3">
              <div className="text-tag font-extrabold uppercase tracking-[0.5px] text-faint">
                Departs
              </div>
              <div className="mt-0.5 text-subtitle font-bold tabular-nums">
                {dep}
              </div>
            </div>
          )}
          {arr && (
            <div className="flex-1 rounded-md border border-border bg-surface px-4 py-3">
              <div className="text-tag font-extrabold uppercase tracking-[0.5px] text-faint">
                Arrives
              </div>
              <div className="mt-0.5 text-subtitle font-bold tabular-nums">
                {arr}
              </div>
            </div>
          )}
        </div>
      )}

      {layovers.length > 0 && (
        <div className="mt-[18px] rounded-md border border-border bg-surface px-4 py-3">
          <div className="text-tag font-extrabold uppercase tracking-[0.5px] text-faint">
            {layovers.length === 1 ? "Layover" : "Layovers"}
          </div>
          <div className="mt-1.5 flex flex-col gap-1.5">
            {layovers.map((lo, i) => (
              <div
                key={i}
                className="flex items-baseline justify-between gap-3"
              >
                <span className="min-w-0 flex-1 text-body font-bold [text-wrap:pretty]">
                  {lo.airport}
                </span>
                {lo.duration && (
                  <span className="shrink-0 text-small font-semibold text-muted tabular-nums">
                    {formatDuration(lo.duration)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {flight.note && (
        <div className="mt-4 text-lead font-medium leading-[1.5] text-ink-soft [text-wrap:pretty]">
          {flight.note}
        </div>
      )}
    </DetailShell>
  );
}
