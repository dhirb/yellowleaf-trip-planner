import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Join class names and let later Tailwind utilities win over earlier ones for
 * the same CSS property (e.g. `cn(ui.input, "h-[50px]")` overrides the base
 * height). Use whenever a shared class string is combined with overrides.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
