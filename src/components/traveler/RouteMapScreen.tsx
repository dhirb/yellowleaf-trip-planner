import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Trip } from "../../types";
import { rangeLabel } from "../../lib/date";
import { routePins } from "../../lib/mapPins";
import { cn } from "../../lib/cn";
import { ui } from "../../lib/ui";
import { MapShell } from "./MapShell";
import { PinMap } from "./PinMap";

interface RouteMapScreenProps {
  trip: Trip;
  lang: string;
  onBack: () => void;
}

/** Space the bottom card takes, so fitting the route keeps pins above it. */
const CARD_INSET = 110;

/**
 * Full-screen route overview: every base pinned and numbered in check-in
 * order, with a card for the selected one. Tapping a pin, or the arrows,
 * moves the selection; the map pans to follow.
 */
export function RouteMapScreen({ trip, lang, onBack }: RouteMapScreenProps) {
  const pins = useMemo(() => routePins(trip, lang), [trip, lang]);
  const [selected, setSelected] = useState(0);
  // Clamp rather than reset: a base removed mid-view should not throw.
  const safe = Math.max(0, Math.min(selected, pins.length - 1));
  const pin = pins[safe];
  const step = (delta: number) =>
    setSelected((safe + delta + pins.length) % pins.length);

  return (
    <MapShell
      title="Your route"
      sub={`${pins.length} ${pins.length === 1 ? "base" : "bases"} · ${trip.country}`}
      onBack={onBack}
      testId="route-map-screen"
    >
      <PinMap
        pins={pins}
        route
        selectedId={pin?.id ?? null}
        onSelect={(id) => setSelected(pins.findIndex((p) => p.id === id))}
        bottomInset={CARD_INSET}
        ariaLabel="Map of your route"
      />

      {pin && (
        // Leaflet's panes sit at z-index 400–1000, so the card goes above them.
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1100] p-[14px]">
          <div
            data-testid="map-card"
            className={cn(
              ui.card,
              "pointer-events-auto flex items-center gap-[12px] p-[14px]",
            )}
          >
            <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-accent text-lead font-extrabold text-white">
              {pin.order}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-lead font-extrabold tracking-[-0.2px]">
                {pin.label}
              </div>
              {pin.name !== pin.label && (
                <div className="truncate text-small font-semibold text-muted">
                  {pin.name}
                </div>
              )}
              <div className="mt-px text-caption font-bold text-faint">
                {rangeLabel(pin.checkIn, pin.checkOut)} · {pin.nights}{" "}
                {pin.nights === 1 ? "night" : "nights"}
              </div>
            </div>
            {pins.length > 1 && (
              <div className="flex shrink-0 gap-[6px]">
                <button
                  onClick={() => step(-1)}
                  aria-label="Previous base"
                  className={cn(ui.chevBtn, "h-[40px] w-[40px] rounded-[12px]")}
                >
                  <ChevronLeft
                    size={20}
                    strokeWidth={2.6}
                    className="text-ink-dim"
                  />
                </button>
                <button
                  onClick={() => step(1)}
                  aria-label="Next base"
                  className={cn(ui.chevBtn, "h-[40px] w-[40px] rounded-[12px]")}
                >
                  <ChevronRight
                    size={20}
                    strokeWidth={2.6}
                    className="text-ink-dim"
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </MapShell>
  );
}
