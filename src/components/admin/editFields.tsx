import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

/** Shared control styling for the admin edit screens. */
export const fieldInput =
  "h-12 w-full rounded-sm border border-border-strong bg-surface px-[12px] py-0 text-[15px] text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15";

export const fieldTextarea =
  "min-h-[120px] w-full resize-y rounded-sm border border-border-strong bg-surface px-[12px] py-[10px] text-[15px] font-medium leading-[1.5] text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15";

/** A labeled field block with generous vertical rhythm for the roomy edit screens. */
export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("mb-[18px] block", className)}>
      <span className="mb-[7px] block text-[11.5px] font-extrabold uppercase tracking-[0.4px] text-faint">
        {label}
      </span>
      {children}
    </label>
  );
}

interface EditableFieldProps {
  label: string;
  value: string;
  /** Receives the new string; callers typically run `update((t) => updateX(...))`. */
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  /** Defaults to `label` when the accessible name should differ from the visible one. */
  ariaLabel?: string;
  bold?: boolean;
  multiline?: boolean;
  /** Forwarded to the surrounding Field (e.g. width/flex in a row). */
  className?: string;
}

/**
 * A labeled text input (or textarea) wired straight to a string setter — the
 * common shape across the admin edit screens. It just unwraps the DOM event so
 * callers express intent as `onChange={(v) => update(...)}` instead of repeating
 * the Field + input boilerplate.
 */
export function EditableField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  ariaLabel,
  bold,
  multiline,
  className,
}: EditableFieldProps) {
  return (
    <Field label={label} className={className}>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={ariaLabel ?? label}
          placeholder={placeholder}
          className={fieldTextarea}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={ariaLabel ?? label}
          placeholder={placeholder}
          className={cn(fieldInput, bold && "font-bold")}
        />
      )}
    </Field>
  );
}
