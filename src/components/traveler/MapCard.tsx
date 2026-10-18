import { Maximize2 } from "lucide-react";
import type { ReactNode } from "react";
import type { Pin } from "../../lib/mapPins";
import { cn } from "../../lib/cn";
import { ui } from "../../lib/ui";
import { PinMap } from "./PinMap";

interface MapCardProps {
  title: string;
  sub?: string;
  pins: Pin[];
  route?: boolean;
  /** Map height in px. */
  height: number;
  onExpand: () => void;
  testId?: string;
  icon: ReactNode;
  /** Whether the day this card sits in is on screen (see PinMap). */
  active: boolean;
}

/**
 * A small, non-interactive map inside the day's scroll. Any tap on it — the
 * map, a pin, or the corner button — opens the full-screen version, where
 * panning, zooming and pin labels live. Keeping the card static means a thumb
 * scrolling the day never gets caught dragging a map.
 */
export function MapCard({
  title,
  sub,
  pins,
  route,
  height,
  onExpand,
  testId,
  icon,
  active,
}: MapCardProps) {
  return (
    <div
      data-testid={testId}
      className={cn(ui.card, "relative mb-[14px] overflow-hidden")}
    >
      <div className="flex items-center gap-[10px] px-[14px] pt-[12px] pb-[9px]">
        <div className="text-accent">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="text-tag font-extrabold uppercase tracking-[0.6px] text-faint">
            {title}
          </div>
          {sub && (
            <div className="truncate text-small font-semibold text-muted">
              {sub}
            </div>
          )}
        </div>
      </div>
      <div className="relative" style={{ height }}>
        <PinMap
          pins={pins}
          route={route}
          interactive={false}
          active={active}
          ariaLabel={title}
          fallback={
            <div className="flex h-full items-center justify-center bg-surface-sunken text-small font-semibold text-faint">
              Map unavailable offline
            </div>
          }
        />
        {/* Sits above Leaflet's panes (z-index 400–1000), stopping short of
            the attribution strip so the OpenStreetMap link stays clickable. */}
        <button
          type="button"
          onClick={onExpand}
          aria-label={`Open ${title.toLowerCase()}`}
          className="absolute inset-x-0 top-0 bottom-[20px] z-[1100] cursor-pointer bg-transparent"
        />
        <div className="pointer-events-none absolute top-[10px] right-[10px] z-[1101] flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-border bg-surface/95 text-ink-dim shadow-soft">
          <Maximize2 size={16} strokeWidth={2.4} />
        </div>
      </div>
    </div>
  );
}
