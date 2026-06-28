import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { ui } from "../../lib/ui";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  children: ReactNode;
}

/** Primary (accent) or ghost button using the shared design classes. */
export function Button({
  variant = "primary",
  children,
  className,
  ...rest
}: ButtonProps) {
  const base = variant === "primary" ? ui.btnPrimary : ui.btnGhost;
  return (
    <button
      {...rest}
      className={cn(
        base,
        rest.disabled && "cursor-default opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}
