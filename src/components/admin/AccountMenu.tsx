import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";
import { THEMES, THEME_LABELS } from "../../lib/theme";
import { useTheme } from "../../hooks/useTheme";

interface AccountMenuProps {
  email: string | null;
  name: string | null;
  photoURL: string | null;
  onSignOut: () => void;
}

/** Derive a single-letter avatar fallback from the user's name or email. */
function initialOf(name: string | null, email: string | null): string {
  const source = (name || email || "?").trim();
  return (source[0] || "?").toUpperCase();
}

/**
 * Trigger button + popover showing the signed-in user's details and a sign-out
 * action. Closes on outside-click or Escape.
 */
export function AccountMenu({
  email,
  name,
  photoURL,
  onSignOut,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const initial = initialOf(name, email);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={cn(
          "flex cursor-pointer items-center gap-[7px] rounded-pill border border-border bg-surface py-[5px] pr-[9px] pl-[5px] shadow-soft transition-colors",
          open ? "border-border-strong" : "hover:border-border-strong",
        )}
      >
        <Avatar initial={initial} photoURL={photoURL} size={28} />
        <Caret open={open} />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute top-full right-0 z-20 mt-[8px] w-max min-w-[230px] overflow-hidden rounded-[14px] border border-border bg-surface shadow-card",
            "origin-top-right",
          )}
        >
          <div className="flex items-center gap-[11px] px-[14px] pt-[14px] pb-[12px]">
            <Avatar initial={initial} photoURL={photoURL} size={42} />
            <div className="min-w-0 flex-1">
              {name && (
                <div className="truncate text-[15px] font-bold tracking-[-0.2px]">
                  {name}
                </div>
              )}
              <div
                className={cn(
                  "font-medium whitespace-nowrap text-muted",
                  name ? "text-[12.5px]" : "text-[14px] text-ink",
                )}
              >
                {email ?? "Signed in"}
              </div>
            </div>
          </div>

          <div className="border-t border-border px-[12px] pt-[11px] pb-[10px]">
            <div className="mb-[8px] text-[11px] font-extrabold uppercase tracking-[0.6px] text-faint">
              Appearance
            </div>
            <ThemeSegment />
          </div>

          <div className="border-t border-border px-[8px] py-[8px]">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="w-full cursor-pointer rounded-[10px] px-[10px] py-[9px] text-left text-[14px] font-bold text-accent transition-colors hover:bg-accent-soft"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** User photo when present, otherwise an accent initial chip. */
function Avatar({
  initial,
  photoURL,
  size,
}: {
  initial: string;
  photoURL: string | null;
  size: number;
}) {
  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-accent font-extrabold text-white"
      style={{ width: size, height: size, fontSize: size * 0.46 }}
    >
      {initial}
    </div>
  );
}

/** Small chevron that flips when the menu is open. */
function Caret({ open }: { open: boolean }) {
  return (
    <ChevronDown
      size={16}
      color="currentColor"
      strokeWidth={2}
      className={cn(
        "text-faint transition-transform duration-150",
        open && "rotate-180",
      )}
    />
  );
}

/** Three-way light/dark/system segmented control for the account popover. */
function ThemeSegment() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex gap-[5px]">
      {THEMES.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTheme(t)}
          className={cn(
            "flex-1 cursor-pointer rounded-[9px] px-0 py-[7px] text-center text-[12.5px] font-bold transition-colors",
            theme === t ? "bg-accent text-white" : "bg-control text-ink-dim",
          )}
        >
          {THEME_LABELS[t]}
        </button>
      ))}
    </div>
  );
}
