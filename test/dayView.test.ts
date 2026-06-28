import { describe, it, expect } from "vitest";
import { imgFor, buildViewItems } from "../src/lib/dayView";
import type { Day, Item } from "../src/types";

const item = (over: Partial<Item> = {}): Item => ({
  kind: "do",
  time: "09:00",
  title: "Visit the temple",
  ...over,
});

describe("imgFor", () => {
  it("returns the trimmed image url when present", () => {
    expect(imgFor(item({ image: " https://x/y.jpg " }))).toBe(
      "https://x/y.jpg",
    );
  });

  it("returns null when the item has no image", () => {
    expect(imgFor(item())).toBeNull();
  });

  it("returns null when the image is blank or whitespace", () => {
    expect(imgFor(item({ image: "" }))).toBeNull();
    expect(imgFor(item({ image: "   " }))).toBeNull();
  });
});

describe("buildViewItems", () => {
  const day = (items: Item[]): Day => ({
    date: "2026-06-27",
    theme: "",
    weather: "",
    items,
    stay: null,
    flights: [],
  });

  it("leaves thumb null for items without an image", () => {
    const [view] = buildViewItems(day([item()]), "en");
    expect(view.thumb).toBeNull();
  });

  it("carries the item's image through to thumb", () => {
    const [view] = buildViewItems(
      day([item({ image: "https://x/y.jpg" })]),
      "en",
    );
    expect(view.thumb).toBe("https://x/y.jpg");
  });
});
