import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

const THRESHOLD = 70;

interface SwipeHandlers {
  dragX: number;
  dragging: boolean;
  onPointerDown: (e: ReactPointerEvent) => void;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerUp: () => void;
}

/**
 * Horizontal drag-to-page gesture. Reports live `dragX` for the rubber-band
 * transform and fires `onPrev`/`onNext` once a swipe passes the threshold.
 */
export function useSwipe(
  onPrev: () => void,
  onNext: () => void,
  enabled = true,
): SwipeHandlers {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const active = useRef(false);

  return {
    dragX,
    dragging,
    onPointerDown: (e) => {
      if (!enabled) return;
      startX.current = e.clientX;
      active.current = true;
      setDragging(true);
    },
    onPointerMove: (e) => {
      if (!active.current) return;
      setDragX(e.clientX - startX.current);
    },
    onPointerUp: () => {
      if (!active.current) return;
      active.current = false;
      const dx = dragX;
      setDragging(false);
      setDragX(0);
      if (dx > THRESHOLD) onPrev();
      else if (dx < -THRESHOLD) onNext();
    },
  };
}
