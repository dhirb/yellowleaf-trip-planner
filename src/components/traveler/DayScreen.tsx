import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type TransitionEvent as ReactTransitionEvent,
} from "react";
import type { Trip } from "../../types";
import type { TimeFormat } from "../../lib/date";
import { DayView } from "./DayView";

/** Min horizontal travel (px) before a release pages to the next/prev day. */
const THRESHOLD = 70;
/** Drag resistance when pulling past the first/last day (no neighbour to show). */
const EDGE_RESISTANCE = 0.3;

interface DayScreenProps {
  trip: Trip;
  dayIndex: number;
  today: string;
  lang: string;
  timeFormat: TimeFormat;
  onSelectDay: (i: number) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onOpenItem: (index: number) => void;
  onOpenFlight: (index: number) => void;
  onOpenStay: () => void;
}

/**
 * Horizontal day pager. Renders the previous, current, and next day side by
 * side so a neighbouring day previews in from the edge while you drag, then
 * settles onto it once the swipe passes the threshold.
 */
export function DayScreen({
  trip,
  dayIndex,
  today,
  lang,
  timeFormat,
  onSelectDay,
  onPrevDay,
  onNextDay,
  onOpenItem,
  onOpenFlight,
  onOpenStay,
}: DayScreenProps) {
  const total = trip.days.length;
  const hasPrev = dayIndex > 0;
  const hasNext = dayIndex < total - 1;

  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  // -1 = settling toward next, 1 = settling toward prev, 0 = at rest.
  const [settle, setSettle] = useState(0);
  // True for the single frame where we swap the day index, so the transform
  // snap that accompanies the reindex doesn't animate.
  const [instant, setInstant] = useState(false);
  const startX = useRef(0);
  const active = useRef(false);

  // Re-enable transitions on the frame after an instant index swap.
  useEffect(() => {
    if (!instant) return;
    const id = requestAnimationFrame(() => setInstant(false));
    return () => cancelAnimationFrame(id);
  }, [instant]);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (settle !== 0) return; // ignore input mid-settle
    startX.current = e.clientX;
    active.current = true;
    setDragging(true);
    setDragX(0);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!active.current) return;
    let dx = e.clientX - startX.current;
    if ((dx > 0 && !hasPrev) || (dx < 0 && !hasNext)) dx *= EDGE_RESISTANCE;
    setDragX(dx);
  };

  const endDrag = () => {
    if (!active.current) return;
    active.current = false;
    setDragging(false);
    setDragX(0);
    if (dragX <= -THRESHOLD && hasNext) setSettle(-1);
    else if (dragX >= THRESHOLD && hasPrev) setSettle(1);
  };

  const cancelDrag = () => {
    if (!active.current) return;
    active.current = false;
    setDragging(false);
    setDragX(0);
  };

  const onTransitionEnd = (e: ReactTransitionEvent) => {
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
    if (settle === -1) {
      setInstant(true);
      setSettle(0);
      onNextDay();
    } else if (settle === 1) {
      setInstant(true);
      setSettle(0);
      onPrevDay();
    }
  };

  // Render the current day plus any existing neighbours, keyed by absolute day
  // index so the same DOM node (and its scroll) survives the reindex on commit.
  const indices: number[] = [];
  for (let i = dayIndex - 1; i <= dayIndex + 1; i++) {
    if (i >= 0 && i < total) indices.push(i);
  }

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-app-bg">
      <div
        className="absolute inset-0"
        style={{
          touchAction: "pan-y",
          transform: `translateX(calc(${settle * 100}% + ${dragX}px))`,
          transition:
            dragging || instant
              ? "none"
              : "transform .28s cubic-bezier(.22,.61,.36,1)",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={cancelDrag}
        onTransitionEnd={onTransitionEnd}
      >
        {indices.map((i) => (
          <div
            key={i}
            className="absolute inset-0"
            style={{ transform: `translateX(${(i - dayIndex) * 100}%)` }}
          >
            <DayView
              trip={trip}
              dayIndex={i}
              today={today}
              lang={lang}
              timeFormat={timeFormat}
              onSelectDay={onSelectDay}
              onPrevDay={onPrevDay}
              onNextDay={onNextDay}
              onOpenItem={onOpenItem}
              onOpenFlight={onOpenFlight}
              onOpenStay={onOpenStay}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
