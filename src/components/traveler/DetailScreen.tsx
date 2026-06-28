import { Lightbulb } from "lucide-react";
import type { ViewItem } from "../../lib/dayView";
import { imgFor } from "../../lib/dayView";
import { formatTime, type TimeFormat } from "../../lib/date";
import { DetailShell } from "./DetailShell";

/**
 * Full-page activity detail. Mirrors the admin edit-screen chrome (a
 * back-chevron header over a scrolling body) so tapping a day card opens a
 * roomy page instead of a bottom sheet.
 */
export function DetailScreen({
  view,
  timeFormat,
  onBack,
}: {
  view: ViewItem;
  timeFormat: TimeFormat;
  onBack: () => void;
}) {
  const { item } = view;
  const banner = imgFor(item);

  return (
    <DetailShell title="Activity" onBack={onBack}>
      {banner && (
        <div
          className="mb-4 h-[200px] rounded-lg shadow-[0_6px_18px_rgba(0,0,0,0.12)]"
          style={{ background: `center/cover url("${banner}")` }}
        />
      )}
      <div className="mt-[2px] mb-1.5 text-display font-extrabold tracking-[-0.4px] [text-wrap:pretty]">
        {view.title}
      </div>
      <div className="mb-1.5 text-body font-extrabold text-faint">
        {formatTime(item.time, timeFormat)}
      </div>
      {view.place && (
        <div className="text-body font-semibold text-muted">{view.place}</div>
      )}
      {item.note && (
        <div className="mt-4 text-lead font-medium leading-[1.5] text-ink-soft [text-wrap:pretty]">
          {item.note}
        </div>
      )}
      {item.cost && (
        <div className="mt-[18px] flex gap-[10px]">
          <div className="flex-1 rounded-md border border-border bg-surface px-4 py-3">
            <div className="text-tag font-extrabold uppercase tracking-[0.5px] text-faint">
              Cost
            </div>
            <div className="mt-0.5 text-lead font-bold">{item.cost}</div>
          </div>
        </div>
      )}
      {item.tip && (
        <div className="mt-3 flex items-start gap-[10px] rounded-md bg-accent-amber px-4 py-[14px]">
          <Lightbulb
            size={20}
            color="#B5701A"
            strokeWidth={2}
            className="mt-px shrink-0"
          />
          <div className="text-body font-semibold leading-[1.4] text-[#8a5a14] dark:text-[#e0b061]">
            {item.tip}
          </div>
        </div>
      )}
    </DetailShell>
  );
}
