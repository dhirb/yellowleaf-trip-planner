import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { ui } from "../../lib/ui";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement>;

/** Input styled with the shared `ui.input` look. */
export function TextField({ className, ...rest }: TextFieldProps) {
  return <input {...rest} className={cn(ui.input, className)} />;
}
