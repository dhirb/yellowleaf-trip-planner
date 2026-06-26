import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { ui } from "../../lib/ui";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  children: ReactNode;
  style?: CSSProperties;
}

/** Primary (accent) or ghost button using the shared design styles. */
export function Button({ variant = "primary", children, style, ...rest }: ButtonProps) {
  const base = variant === "primary" ? ui.btnPrimary : ui.btnGhost;
  return (
    <button {...rest} style={{ ...base, ...(rest.disabled ? { opacity: 0.6, cursor: "default" } : null), ...style }}>
      {children}
    </button>
  );
}
