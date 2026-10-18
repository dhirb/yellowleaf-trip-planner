import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/cn";

export interface SuggestFieldProps<T> {
  value: string;
  onChange: (value: string) => void;
  /** Fired on focus — a hook for lazy-loading whatever backs the suggestions. */
  onFocus?: () => void;
  /** Current suggestions; an empty list keeps the menu closed. */
  items: readonly T[];
  itemKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  onPick: (item: T) => void;
  /** Enter with no menu open — e.g. to run an explicit search. */
  onSubmit?: () => void;
  /** Rendered under the list, e.g. a data attribution. */
  footer?: ReactNode;
  placeholder?: string;
  ariaLabel?: string;
  /** Classes for the input face — callers supply the full control styling. */
  inputClassName?: string;
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
/** Below this much room under the input, the menu flips above it. */
const MIN_SPACE_BELOW = 200;

/**
 * A free-text input with a type-ahead menu. It never constrains what can be
 * typed — picking a suggestion just hands the item to `onPick`, and the caller
 * decides what that writes. The caller also owns the suggestions, so the same
 * control serves an in-memory dataset (airports) and a remote geocoder (cities).
 *
 * The menu is portaled to `document.body` with fixed positioning, mirroring
 * {@link Select}, so the editor's clipping columns never hide it.
 */
export function SuggestField<T>({
  value,
  onChange,
  onFocus,
  items,
  itemKey,
  renderItem,
  onPick,
  onSubmit,
  footer,
  placeholder,
  ariaLabel,
  inputClassName,
}: SuggestFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [rect, setRect] = useState<MenuRect | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const showMenu = open && items.length > 0;

  // Fresh suggestions open the menu even if it was closed — results that
  // arrive after an explicit search (where a button press blurred the input)
  // would otherwise never show.
  useEffect(() => {
    if (items.length > 0) {
      setOpen(true);
      setActive(0);
    }
  }, [items]);

  const measure = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom - MENU_MARGIN;
    const spaceAbove = r.top - MENU_MARGIN;
    const placeAbove = spaceBelow < MIN_SPACE_BELOW && spaceAbove > spaceBelow;
    setRect({
      top: placeAbove ? r.top - MENU_GAP : r.bottom + MENU_GAP,
      left: r.left,
      width: r.width,
      maxHeight: (placeAbove ? spaceAbove : spaceBelow) - MENU_GAP,
      placement: placeAbove ? "above" : "below",
    });
  }, []);

  useEffect(() => {
    if (showMenu) measure();
  }, [showMenu, items.length, measure]);

  // While open: close on outside pointer-down / Escape, and on scroll/resize
  // (a fixed menu would otherwise drift from its input).
  useEffect(() => {
    if (!showMenu) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        !inputRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onReflow = () => setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", onReflow, true);
    window.addEventListener("resize", onReflow);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onReflow, true);
      window.removeEventListener("resize", onReflow);
    };
  }, [showMenu]);

  const choose = (item: T) => {
    onPick(item);
    setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!showMenu) {
      if (e.key === "Enter" && onSubmit) {
        e.preventDefault();
        onSubmit();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(items[Math.min(active, items.length - 1)]);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => {
          onFocus?.();
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={showMenu}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        placeholder={placeholder}
        autoComplete="off"
        className={inputClassName}
      />

      {showMenu &&
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
            {items.map((item, i) => (
              <button
                key={itemKey(item)}
                type="button"
                role="option"
                aria-selected={i === active}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => choose(item)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 px-[14px] py-[10px] text-left transition-colors",
                  i === active ? "bg-control" : "hover:bg-control",
                )}
              >
                {renderItem(item)}
              </button>
            ))}
            {footer && (
              <div className="border-t border-border px-[14px] pt-[7px] pb-[3px] text-[11px] font-medium text-faint">
                {footer}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
