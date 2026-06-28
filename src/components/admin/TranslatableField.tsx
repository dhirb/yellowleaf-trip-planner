import { useState } from "react";
import { Languages } from "lucide-react";
import type { Lang } from "../../types";
import { cn } from "../../lib/cn";
import { Field, fieldInput, fieldTextarea } from "./editFields";
import { TranslationSheet } from "./TranslationSheet";

interface TranslatableFieldProps<V> {
  label: string;
  /** The English value. */
  value: string;
  onChange: (v: string) => void;
  /** Target languages, in display order. */
  langs: Lang[];
  /** The entity's per-language translation map, keyed by Lang.code. */
  translations: Record<string, V> | undefined;
  /** Which field within each translation this widget edits (e.g. "title"). */
  field: keyof V & string;
  onChangeTranslation: (code: string, v: string) => void;
  /** Fill every language for this field via AI. Resolves when done. */
  onTranslate: () => Promise<void>;
  placeholder?: string;
  multiline?: boolean;
}

/** How many target languages have a non-empty value for this field. */
function countTranslated<V>(
  langs: Lang[],
  translations: Record<string, V> | undefined,
  field: keyof V & string,
): number {
  if (!translations) return 0;
  let n = 0;
  for (const lang of langs) {
    const v = translations[lang.code]?.[field];
    if (typeof v === "string" && v.trim() !== "") n += 1;
  }
  return n;
}

/**
 * A translatable field shown on the admin edit screens.
 *
 * With no target languages it degrades to a plain inline input — there is
 * nothing to translate, so the sheet would be empty. Otherwise it collapses to
 * a single tappable row (English value + a translation-count badge); tapping
 * opens {@link TranslationSheet} to edit English and every language at once.
 * This keeps the main edit form to one line per field instead of stacking a
 * preview box under each one.
 */
export function TranslatableField<V>({
  label,
  value,
  onChange,
  langs,
  translations,
  field,
  onChangeTranslation,
  onTranslate,
  placeholder,
  multiline,
}: TranslatableFieldProps<V>) {
  const [open, setOpen] = useState(false);
  const [translating, setTranslating] = useState(false);

  // No languages configured → behave like an ordinary single-language input.
  if (langs.length === 0) {
    return (
      <Field label={label}>
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={label}
            placeholder={placeholder}
            className={fieldTextarea}
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={label}
            placeholder={placeholder}
            className={fieldInput}
          />
        )}
      </Field>
    );
  }

  const translated = countTranslated(langs, translations, field);

  const runTranslate = async () => {
    setTranslating(true);
    try {
      await onTranslate();
    } finally {
      setTranslating(false);
    }
  };

  return (
    <Field label={label}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Edit ${label} and translations`}
        className={cn(
          fieldInput,
          "flex cursor-pointer items-center gap-3 text-left",
          multiline && "h-auto min-h-12 py-[10px]",
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            value ? "text-ink" : "text-faint",
          )}
        >
          {value || placeholder || "—"}
        </span>
        <span className="flex shrink-0 items-center gap-[5px] text-[12px] font-extrabold text-faint">
          <Languages size={15} strokeWidth={2.4} />
          {translated}/{langs.length}
        </span>
      </button>

      {open && (
        <TranslationSheet
          label={label}
          value={value}
          onChange={onChange}
          langs={langs}
          translations={translations}
          field={field}
          onChangeTranslation={onChangeTranslation}
          onTranslate={runTranslate}
          translating={translating}
          multiline={multiline}
          onClose={() => setOpen(false)}
        />
      )}
    </Field>
  );
}
