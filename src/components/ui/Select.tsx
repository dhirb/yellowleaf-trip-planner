import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Shown on the trigger when `value` matches no option (e.g. an add control). */
  placeholder?: string;
  ariaLabel?: string;
  /** Styles the trigger button face (height, border, font weight…). */
  className?: string;
  /** Layout for the root wrapper (width/shrink) in flex rows. */
  wrapperClassName?: string;
}

interface MenuRect {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "below" | "above";
}

const MENU_GAP = 6;
const MENU_MARGIN = 8;
const MIN_MENU_WIDTH = 168;

/**
 * Accessible custom dropdown that replaces the native `<select>`. The menu is
 * real DOM (so it is fully styleable and legible, unlike an OS-drawn `<option>`
 * list) and is portaled to `document.body` with fixed positioning so the app
 * shell's `overflow-hidden` columns can never clip it. Closes on outside
 * pointer-down, Escape, scroll, or resize.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  className,
  wrapperClassName,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<MenuRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selected = options.find((o) => o.value === value) ?? null;

  const measure = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom - MENU_MARGIN;
    const spaceAbove = r.top - MENU_MARGIN;
    const placeAbove = spaceBelow < 200 && spaceAbove > spaceBelow;
    const width = Math.min(
      Math.max(r.width, MIN_MENU_WIDTH),
      window.innerWidth - MENU_MARGIN * 2,
    );
    const left = Math.min(
      Math.max(MENU_MARGIN, r.left),
      window.innerWidth - width - MENU_MARGIN,
    );
    setRect({
      top: placeAbove ? r.top - MENU_GAP : r.bottom + MENU_GAP,
      left,
      width,
      maxHeight: (placeAbove ? spaceAbove : spaceBelow) - MENU_GAP,
      placement: placeAbove ? "above" : "below",
    });
  }, []);

  // Position the menu the moment it opens.
  useEffect(() => {
    if (open) measure();
  }, [open, measure]);

  // While open: close on outside pointer-down / Escape, and on scroll/resize
  // (a fixed menu would otherwise drift away from its trigger).
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onReflow = () => setOpen(false);

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onReflow, true);
    window.addEventListener("resize", onReflow);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onReflow, true);
      window.removeEventListener("resize", onReflow);
    };
  }, [open]);

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className={cn("relative", wrapperClassName)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between gap-2 text-left text-[16px] text-ink outline-none",
          className,
        )}
      >
        <span className={cn("truncate", !selected && "text-muted")}>
          {selected?.label ?? placeholder ?? ""}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2.2}
          className={cn(
            "shrink-0 text-muted transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            id={listboxId}
            aria-label={ariaLabel}
            style={{
              position: "fixed",
              top: rect.placement === "above" ? undefined : rect.top,
              bottom:
                rect.placement === "above"
                  ? window.innerHeight - rect.top
                  : undefined,
              left: rect.left,
              width: rect.width,
              maxHeight: rect.maxHeight,
            }}
            className="z-50 overflow-y-auto overflow-x-hidden rounded-[14px] border border-border bg-surface py-[6px] shadow-card [-webkit-overflow-scrolling:touch]"
          >
            {options.map((o) => {
              const isSelected = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => choose(o.value)}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-2 px-[14px] py-[11px] text-left text-[15.5px] transition-colors",
                    isSelected
                      ? "font-bold text-accent"
                      : "font-semibold text-ink hover:bg-control",
                  )}
                >
                  <span className="truncate">{o.label}</span>
                  {isSelected && <Check size={16} strokeWidth={2.4} />}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
