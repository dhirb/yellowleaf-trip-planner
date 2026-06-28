import { createPortal } from "react-dom";
import { Sparkles } from "lucide-react";
import type { Lang } from "../../types";
import { cn } from "../../lib/cn";
import { ui } from "../../lib/ui";
import { fieldInput, fieldTextarea } from "./editFields";

interface TranslationSheetProps<V> {
  /** Field label, shown as the sheet title (e.g. "Name"). */
  label: string;
  /** The English value, editable at the top of the sheet. */
  value: string;
  onChange: (v: string) => void;
  /** Target languages, in display order. */
  langs: Lang[];
  /** The entity's per-language translation map, keyed by Lang.code. */
  translations: Record<string, V> | undefined;
  /** Which field within each translation this sheet edits. */
  field: keyof V & string;
  onChangeTranslation: (code: string, v: string) => void;
  /** Fill every language for this field via AI. */
  onTranslate: () => void;
  translating: boolean;
  /** Render multi-line inputs (English + each language) for long fields. */
  multiline?: boolean;
  onClose: () => void;
}

/** Read one language's value for the field, coercing absent/non-string to "". */
function transValue<V>(
  translations: Record<string, V> | undefined,
  code: string,
  field: keyof V & string,
): string {
  const v = translations?.[code]?.[field];
  return typeof v === "string" ? v : "";
}

/**
 * Bottom sheet for editing one field across English and every target language.
 *
 * A backdrop + slide-up panel overlay. Translation edits and the AI fill both
 * flow back through the caller's reducers.
 */
export function TranslationSheet<V>({
  label,
  value,
  onChange,
  langs,
  translations,
  field,
  onChangeTranslation,
  onTranslate,
  translating,
  multiline,
  onClose,
}: TranslationSheetProps<V>) {
  // Anchor to the app viewport (not the inline form): the day-title widget lives
  // inside a `transform`ed swipe wrapper, which would otherwise capture the
  // sheet's absolute positioning and push it below the scrolled content.
  const target =
    (typeof document !== "undefined" &&
      document.getElementById("app-viewport")) ||
    (typeof document !== "undefined" ? document.body : null);
  if (!target) return null;

  return createPortal(
    <>
      <div
        onClick={onClose}
        className="absolute inset-0 z-[80] animate-fade-in bg-black/50"
      />
      <div className="no-scrollbar absolute bottom-0 left-0 right-0 z-[81] max-h-[82%] animate-sheet-up overflow-y-auto rounded-t-[28px] bg-app-bg px-[22px] pt-3 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
        <div className="mx-auto mt-1 mb-[18px] h-[5px] w-11 rounded-[99px] bg-border-strong" />

        <div className="mb-[18px] text-[22px] font-extrabold tracking-[-0.3px]">
          {label}
        </div>

        {/* English (source) */}
        <label className="mb-[18px] block">
          <span className="mb-[7px] block text-[11.5px] font-extrabold uppercase tracking-[0.4px] text-faint">
            English
          </span>
          {multiline ? (
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              aria-label={`${label} in English`}
              placeholder="English…"
              className={fieldTextarea}
            />
          ) : (
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              aria-label={`${label} in English`}
              placeholder="English…"
              className={fieldInput}
            />
          )}
        </label>

        {/* AI translate */}
        <button
          onClick={onTranslate}
          disabled={translating || value.trim() === ""}
          className={cn(
            "mb-[20px] flex h-10 items-center gap-[6px] rounded-sm bg-ink px-[14px] text-[13px] font-extrabold text-app-bg touch-manipulation",
            translating || value.trim() === ""
              ? "cursor-default opacity-50"
              : "cursor-pointer opacity-100",
          )}
        >
          <Sparkles size={15} />
          {translating ? "Translating…" : "Translate with AI"}
        </button>

        {/* Per-language overrides */}
        {langs.map((lang) => (
          <label key={lang.code} className="mb-[16px] block">
            <span className="mb-[7px] block text-[11.5px] font-extrabold uppercase tracking-[0.4px] text-faint">
              {lang.label}
            </span>
            {multiline ? (
              <textarea
                value={transValue(translations, lang.code, field)}
                onChange={(e) => onChangeTranslation(lang.code, e.target.value)}
                aria-label={`${label} in ${lang.label}`}
                placeholder={`${lang.label}…`}
                className={fieldTextarea}
              />
            ) : (
              <input
                value={transValue(translations, lang.code, field)}
                onChange={(e) => onChangeTranslation(lang.code, e.target.value)}
                aria-label={`${label} in ${lang.label}`}
                placeholder={`${lang.label}…`}
                className={fieldInput}
              />
            )}
          </label>
        ))}

        <button onClick={onClose} className={cn(ui.btnGhost, "mt-3")}>
          Done
        </button>
      </div>
    </>,
    target,
  );
}
