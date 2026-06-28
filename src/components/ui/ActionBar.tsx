import { Trash2 } from "lucide-react";
import { ReorderControls } from "./ReorderControls";

export interface ReorderProps {
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
}

interface ActionBarProps {
  /** Reorder controls on the left; omit for single-instance entities (e.g. stay). */
  reorder?: ReorderProps;
  onDelete: () => void;
  /** Label for the delete button (e.g. "Remove accommodation"). */
  deleteLabel?: string;
}

/** Shared card/screen footer: horizontal reorder controls on the left, labeled delete on the right. */
export function ActionBar({
  reorder,
  onDelete,
  deleteLabel = "Delete",
}: ActionBarProps) {
  return (
    <div className="mt-[10px] flex items-center justify-between border-t border-[#efe7da] pt-[10px]">
      {reorder ? <ReorderControls {...reorder} /> : <span />}
      <button
        type="button"
        onClick={onDelete}
        aria-label={deleteLabel}
        className="flex h-10 shrink-0 cursor-pointer items-center gap-[6px] rounded-[11px] bg-[#fbeeec] px-[14px] text-[13.5px] font-bold text-[#b4453a] transition touch-manipulation hover:bg-[#f7e2df] active:scale-95"
      >
        <Trash2 size={16} />
        {deleteLabel}
      </button>
    </div>
  );
}
