import type { ReactNode } from "react";
import type { ViewItem } from "../../lib/dayView";
import { formatTime, type TimeFormat } from "../../lib/date";
import { cn } from "../../lib/cn";
import { ui } from "../../lib/ui";
import { ChevronRight } from "lucide-react";

interface ActivityCardProps {
  view: ViewItem;
  timeFormat: TimeFormat;
  onOpen: () => void;
  /** Extra classes for the card face (e.g. `mb-0` when wrapped in a list row). */
  className?: string;
  /**
   * Replaces the trailing chevron with custom controls (e.g. reorder buttons in
   * the admin list). When set, the tap area becomes an inner button so the
   * controls aren't nested inside it.
   */
  trailing?: ReactNode;
}

const Thumb = ({ url }: { url: string }) => (
  <div
    className="size-[46px] shrink-0 rounded-[14px] shadow-[0_5px_12px_rgba(0,0,0,0.14)]"
    style={{ background: `center/cover url("${url}")` }}
  />
);

/**
 * A single activity row card. Shared by the traveler day list and the admin
 * day editor so both surfaces render identically; the tap target is the whole
 * card (or the inner area when `trailing` controls are supplied).
 */
export function ActivityCard({
  view,
  timeFormat,
  onOpen,
  className,
  trailing,
}: ActivityCardProps) {
  const content = (
    <>
      {view.thumb && <Thumb url={view.thumb} />}
      <div className="min-w-0 flex-1">
        <div className="text-caption font-extrabold text-faint">
          {formatTime(view.item.time, timeFormat)}
        </div>
        <div className="my-px text-lead font-bold tracking-[-0.2px] [text-wrap:pretty]">
          {view.title}
        </div>
        <div className="text-small font-medium text-muted">{view.place}</div>
      </div>
    </>
  );

  if (trailing !== undefined) {
    return (
      <div className={cn(ui.cardRow, "w-full", className)}>
        <button
          onClick={onOpen}
          className="flex min-w-0 flex-1 items-center gap-[14px] text-left"
        >
          {content}
        </button>
        {trailing}
      </div>
    );
  }

  return (
    <button
      onClick={onOpen}
      className={cn(ui.cardRow, "w-full text-left", className)}
    >
      {content}
      <ChevronRight size={18} color="#CFC6B5" strokeWidth={2.4} />
    </button>
  );
}
