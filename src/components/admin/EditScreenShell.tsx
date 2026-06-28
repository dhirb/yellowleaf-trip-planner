import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "../../lib/cn";
import { ui } from "../../lib/ui";

interface EditScreenShellProps {
  title: string;
  onBack: () => void;
  saving?: boolean;
  children: ReactNode;
}

/**
 * Full-screen admin edit surface: a back-chevron header (mirroring the Editor
 * header) over a scrolling body. Used by the item/flight/stay edit screens so
 * tapping a day card opens a roomy, consistent editor.
 */
export function EditScreenShell({
  title,
  onBack,
  saving,
  children,
}: EditScreenShellProps) {
  return (
    <div className="flex h-full flex-col bg-app-bg">
      <div className="flex shrink-0 items-center gap-[10px] px-4 pt-[max(env(safe-area-inset-top),14px)] pb-3">
        <button
          onClick={onBack}
          aria-label="Back"
          className={cn(ui.chevBtn, "h-[44px] w-[44px]")}
        >
          <ChevronLeft size={22} color="#7A6F60" strokeWidth={2.6} />
        </button>
        <div className="min-w-0 flex-1 overflow-hidden text-[20px] font-extrabold tracking-[-0.3px] text-ellipsis whitespace-nowrap">
          {title}
          {saving && (
            <span className="ml-2 text-[12px] font-semibold text-fainter">
              saving…
            </span>
          )}
        </div>
      </div>
      <div
        className={cn(
          "no-scrollbar",
          "min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-[18px] pt-1 pb-[26px]",
        )}
      >
        {children}
      </div>
    </div>
  );
}
