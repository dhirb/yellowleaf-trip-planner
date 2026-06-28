/**
 * Traveler text-size preference. A small fixed scale that only ever grows from
 * the baseline, exposed as a multiplier the CSS type tokens read via
 * `var(--font-scale)`. Kept framework-free so it can be unit-tested in node.
 */
export type FontStep = "standard" | "large" | "xlarge";

export const FONT_STEPS: readonly FontStep[] = ["standard", "large", "xlarge"];

const FONT_SCALE: Record<FontStep, number> = {
  standard: 1,
  large: 1.15,
  xlarge: 1.3,
};

export const FONT_STEP_LABELS: Record<FontStep, string> = {
  standard: "Standard",
  large: "Large",
  xlarge: "X-Large",
};

export function isFontStep(value: unknown): value is FontStep {
  return typeof value === "string" && value in FONT_SCALE;
}

export function scaleFor(step: FontStep): number {
  return FONT_SCALE[step];
}
