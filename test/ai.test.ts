import { describe, it, expect } from "vitest";
import type { Item } from "../src/types";
import { pickItemFields } from "../src/lib/ai";

describe("pickItemFields", () => {
  it("returns only non-empty translatable fields", () => {
    const item: Item = {
      kind: "attraction",
      time: "09:00",
      title: "Kinkaku-ji",
      place: "Kyoto",
      tag: "",
      note: "  ",
      tip: "Go early",
    };
    expect(pickItemFields(item)).toEqual({
      title: "Kinkaku-ji",
      place: "Kyoto",
      tip: "Go early",
    });
  });
});
