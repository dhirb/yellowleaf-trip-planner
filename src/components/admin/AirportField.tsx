import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useDebounce } from "../../hooks/useDebounce";
import { cn } from "../../lib/cn";
import { fieldInput } from "./editFields";
import {
  loadAirports,
  searchAirports,
  formatAirport,
  type Airport,
} from "../../lib/airports";

interface AirportFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  /** Extra classes merged onto the input face (e.g. font weight, flex sizing). */
  className?: string;
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
const MAX_SUGGESTIONS = 7;
/** Settle time before re-filtering the ~4.5k-row dataset as the admin types. */
const FILTER_DEBOUNCE_MS = 120;

/**
 * A free-text airport input with type-ahead suggestions from the OurAirports
 * dataset. It never constrains what the admin can type — picking a suggestion
 * just fills in the canonical "City (IATA)" label. The dataset loads lazily on
 * first focus, so it costs nothing until someone edits a flight.
 *
 * The suggestion menu is portaled to `document.body` with fixed positioning,
 * mirroring {@link Select}, so the editor's clipping columns never hide it.
 */
export function AirportField({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
}: AirportFieldProps) {
  const [airports, setAirports] = useState<Airport[] | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [rect, setRect] = useState<MenuRect | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Load the dataset once, on first focus.
  const ensureLoaded = useCallback(() => {
    if (airports) return;
    loadAirports()
      .then(setAirports)
      .catch(() => {
        /* offline / fetch failed — the field stays a plain text input */
      });
  }, [airports]);

  // Filter on a debounced copy of the value — the input stays instant, but the
  // full-dataset scan only runs once typing settles.
  const query = useDebounce(value, FILTER_DEBOUNCE_MS);
  const matches = useMemo(
    () => (airports ? searchAirports(airports, query, MAX_SUGGESTIONS) : []),
    [airports, query],
  );

  // A suggestion identical to the current value is noise — hide the menu then.
  const showMenu =
    open &&
    matches.length > 0 &&
    !(matches.length === 1 && formatAirport(matches[0]) === value);

  const measure = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom - MENU_MARGIN;
    const spaceAbove = r.top - MENU_MARGIN;
    const placeAbove = spaceBelow < 200 && spaceAbove > spaceBelow;
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
  }, [showMenu, matches.length, measure]);

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

  const choose = (a: Airport) => {
    onChange(formatAirport(a));
    setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!showMenu) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(matches[Math.min(active, matches.length - 1)]);
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
          ensureLoaded();
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
        className={cn(fieldInput, className)}
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
            {matches.map((a, i) => (
              <button
                key={a.iata}
                type="button"
                role="option"
                aria-selected={i === active}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => choose(a)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 px-[14px] py-[10px] text-left transition-colors",
                  i === active ? "bg-control" : "hover:bg-control",
                )}
              >
                <span className="w-9 shrink-0 text-[12px] font-extrabold text-faint tabular-nums">
                  {a.iata}
                </span>
                <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">
                  {a.city || a.name}
                  {a.country && (
                    <span className="font-medium text-muted">
                      {" "}
                      · {a.country}
                    </span>
                  )}
                </span>
              </button>
            ))}
            {/* ODbL/public-domain attribution, shown where the data is used. */}
            <div className="border-t border-border px-[14px] pt-[7px] pb-[3px] text-[11px] font-medium text-faint">
              Airport data · OurAirports + OpenFlights
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
