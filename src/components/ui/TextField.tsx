import type { CSSProperties, InputHTMLAttributes } from "react";
import { ui } from "../../lib/ui";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  style?: CSSProperties;
}

/** Input styled with the shared `ui.input` look. */
export function TextField({ style, ...rest }: TextFieldProps) {
  return <input {...rest} style={{ ...ui.input, ...style }} />;
}
