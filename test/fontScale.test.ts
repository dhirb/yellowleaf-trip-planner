import { describe, it, expect } from "vitest";
import {
  FONT_STEPS,
  FONT_STEP_LABELS,
  isFontStep,
  scaleFor,
  type FontStep,
} from "../src/lib/fontScale";

describe("fontScale", () => {
  it("exposes the three steps in order", () => {
    expect(FONT_STEPS).toEqual(["standard", "large", "xlarge"]);
  });

  it("maps each step to the correct numeric scale", () => {
    expect(scaleFor("standard")).toBe(1);
    expect(scaleFor("large")).toBe(1.15);
    expect(scaleFor("xlarge")).toBe(1.3);
  });

  it("has a human label for every step", () => {
    for (const step of FONT_STEPS) {
      expect(FONT_STEP_LABELS[step as FontStep]).toBeTruthy();
    }
  });

  it("accepts valid step strings", () => {
    expect(isFontStep("standard")).toBe(true);
    expect(isFontStep("xlarge")).toBe(true);
  });

  it("rejects invalid or non-string values", () => {
    expect(isFontStep("huge")).toBe(false);
    expect(isFontStep("")).toBe(false);
    expect(isFontStep(null)).toBe(false);
    expect(isFontStep(2)).toBe(false);
  });
});
