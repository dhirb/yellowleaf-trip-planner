import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

interface ReorderControlsProps {
  onUp: () => void;
  onDown: () => void;
  canUp: boolean;
  canDown: boolean;
  /** Stack the buttons vertically (e.g. a reorder column beside a list card). */
  orientation?: "horizontal" | "vertical";
}

const btnBase =
  "flex h-10 w-10 items-center justify-center rounded-[11px] bg-control transition touch-manipulation";

/** Up/down buttons for reordering a list item. Ends disable themselves. */
export function ReorderControls({
  onUp,
  onDown,
  canUp,
  canDown,
  orientation = "horizontal",
}: ReorderControlsProps) {
  // A single-item list can move neither up nor down — hide the controls entirely.
  if (!canUp && !canDown) return null;

  return (
    <div
      className={cn(
        "flex shrink-0 gap-2",
        orientation === "vertical" ? "flex-col" : "flex-row",
      )}
    >
      <button
        type="button"
        onClick={onUp}
        disabled={!canUp}
        aria-label="Move up"
        className={cn(
          btnBase,
          canUp
            ? "cursor-pointer hover:bg-[#ece3d4] active:scale-95"
            : "cursor-default opacity-40",
        )}
      >
        <ChevronUp size={18} color="#8A8175" strokeWidth={2.2} />
      </button>
      <button
        type="button"
        onClick={onDown}
        disabled={!canDown}
        aria-label="Move down"
        className={cn(
          btnBase,
          canDown
            ? "cursor-pointer hover:bg-[#ece3d4] active:scale-95"
            : "cursor-default opacity-40",
        )}
      >
        <ChevronDown size={18} color="#8A8175" strokeWidth={2.2} />
      </button>
    </div>
  );
}
