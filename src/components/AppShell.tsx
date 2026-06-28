import type { ReactNode } from "react";

/**
 * App shell: a full-height responsive column on the app background. Full-bleed
 * on phones; centered with a comfortable max-width on larger screens so the
 * mobile-first layout stays readable instead of stretching edge to edge.
 *
 * Children render inside a fixed-viewport flex column — screens manage their
 * own internal scrolling via `h-full` + `overflow-y-auto` body regions.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 flex justify-center overflow-hidden bg-backdrop-mid">
      <div
        id="app-viewport"
        className="relative flex h-full w-full max-w-[440px] flex-col overflow-hidden bg-app-bg shadow-[0_0_60px_rgba(80,55,25,0.10)]"
      >
        {children}
      </div>
    </div>
  );
}
