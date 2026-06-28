import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "../../lib/cn";
import { ui } from "../../lib/ui";

/**
 * Shared chrome for the traveler full-page detail views (activity, flight,
 * stay): a back-chevron header over a scrolling body. Mirrors the admin
 * edit-screen layout so every "tap a card → roomy page" surface looks the same.
 */
export function DetailShell({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
}) {
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
        <div className="min-w-0 flex-1 overflow-hidden text-subtitle font-extrabold tracking-[-0.3px] text-ellipsis whitespace-nowrap">
          {title}
        </div>
      </div>

      <div
        className={cn(
          "no-scrollbar",
          "min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-[22px] pt-1 pb-[26px]",
        )}
      >
        {children}
      </div>
    </div>
  );
}
