import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "../../lib/cn";
import { ui } from "../../lib/ui";

/**
 * Full-screen chrome for a map: the detail views' back-chevron header over a
 * map that fills the rest. Mirrors {@link DetailShell}, minus the padded
 * scrolling body a map has no use for.
 */
export function MapShell({
  title,
  sub,
  onBack,
  children,
  testId,
}: {
  title: string;
  sub?: string;
  onBack: () => void;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <div className="flex h-full flex-col bg-app-bg" data-testid={testId}>
      <div className="flex shrink-0 items-center gap-[10px] px-4 pt-[max(env(safe-area-inset-top),14px)] pb-3">
        <button
          onClick={onBack}
          aria-label="Back"
          className={cn(ui.chevBtn, "h-[44px] w-[44px]")}
        >
          <ChevronLeft size={22} color="#7A6F60" strokeWidth={2.6} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-subtitle font-extrabold tracking-[-0.3px]">
            {title}
          </div>
          {sub && (
            <div className="truncate text-small font-semibold text-muted">
              {sub}
            </div>
          )}
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
