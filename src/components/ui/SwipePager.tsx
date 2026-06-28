import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type TransitionEvent as ReactTransitionEvent,
} from "react";
import { cn } from "../../lib/cn";

/** Min horizontal travel (px) before a release pages to the next/prev panel. */
const THRESHOLD = 70;
/** Drag resistance when pulling past the first/last panel (no neighbour). */
const EDGE_RESISTANCE = 0.3;

interface SwipePagerProps {
  /** Absolute index of the active panel. */
  index: number;
  /** Total number of panels. */
  count: number;
  onPrev: () => void;
  onNext: () => void;
  /** Renders the panel at absolute index `i`. Keyed by `i` so its DOM (and any
   *  internal scroll) survives the reindex when a swipe commits. */
  renderPanel: (i: number) => ReactNode;
  className?: string;
}

/**
 * Horizontal swipe pager. Renders the previous, current, and next panel side by
 * side so a neighbour previews in from the edge while you drag, then settles
 * onto it once the swipe passes the threshold. Shared by the traveler day pager
 * and the admin day editor so both gestures feel identical.
 */
export function SwipePager({
  index,
  count,
  onPrev,
  onNext,
  renderPanel,
  className,
}: SwipePagerProps) {
  const hasPrev = index > 0;
  const hasNext = index < count - 1;

  const [dragging, setDragging] = useState(false);
  // -1 = settling toward next, 1 = settling toward prev, 0 = at rest.
  const [settle, setSettle] = useState(0);
  // True for the single frame where we swap the index, so the transform snap
  // that accompanies the reindex doesn't animate.
  const [instant, setInstant] = useState(false);
  const startX = useRef(0);
  const active = useRef(false);
  // The moving track. The live drag offset is written straight to its
  // `transform` (see onPointerMove) so a gesture doesn't re-render React on
  // every pointer event — that would rebuild all three day panels per frame.
  const trackRef = useRef<HTMLDivElement>(null);
  // Current drag offset (px). A ref, not state: read at commit for the
  // threshold test and during render for continuity, but never triggers a
  // render itself.
  const dragX = useRef(0);

  // Re-enable transitions on the frame after an instant index swap.
  useEffect(() => {
    if (!instant) return;
    const id = requestAnimationFrame(() => setInstant(false));
    return () => cancelAnimationFrame(id);
  }, [instant]);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (settle !== 0) return; // ignore input mid-settle
    startX.current = e.clientX;
    dragX.current = 0;
    active.current = true;
    setDragging(true);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!active.current) return;
    let dx = e.clientX - startX.current;
    if ((dx > 0 && !hasPrev) || (dx < 0 && !hasNext)) dx *= EDGE_RESISTANCE;
    dragX.current = dx;
    // Write straight to the DOM — no setState, so panels aren't rebuilt.
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(${dx}px)`;
    }
  };

  const endDrag = () => {
    if (!active.current) return;
    active.current = false;
    const dx = dragX.current;
    dragX.current = 0;
    // Drop dragging first so the commit render re-enables the settle
    // transition, animating from the current imperative offset.
    setDragging(false);
    if (dx <= -THRESHOLD && hasNext) setSettle(-1);
    else if (dx >= THRESHOLD && hasPrev) setSettle(1);
  };

  const cancelDrag = () => {
    if (!active.current) return;
    active.current = false;
    dragX.current = 0;
    setDragging(false);
  };

  const onTransitionEnd = (e: ReactTransitionEvent) => {
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
    if (settle === -1) {
      setInstant(true);
      setSettle(0);
      onNext();
    } else if (settle === 1) {
      setInstant(true);
      setSettle(0);
      onPrev();
    }
  };

  // Current panel plus any existing neighbours, keyed by absolute index.
  const indices: number[] = [];
  for (let i = index - 1; i <= index + 1; i++) {
    if (i >= 0 && i < count) indices.push(i);
  }

  return (
    <div className={cn("relative min-h-0 flex-1 overflow-hidden", className)}>
      <div
        ref={trackRef}
        className="absolute inset-0"
        style={{
          touchAction: "pan-y",
          transform: `translateX(calc(${settle * 100}% + ${
            dragging ? dragX.current : 0
          }px))`,
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
            style={{ transform: `translateX(${(i - index) * 100}%)` }}
          >
            {renderPanel(i)}
          </div>
        ))}
      </div>
    </div>
  );
}
