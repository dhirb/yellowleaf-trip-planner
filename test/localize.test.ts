import { describe, it, expect } from "vitest";
import type { Day, Item, Stay } from "../src/types";
import {
  localizeItem,
  localizeStay,
  localizeDayTheme,
} from "../src/lib/localize";

const item: Item = {
  kind: "attraction",
  time: "09:00",
  title: "Golden Pavilion",
  place: "Kyoto",
  tag: "Temple",
  note: "A famous gilded temple.",
  tip: "Go early.",
  t: { ja: { title: "金閣寺", place: "京都", note: "" } },
};

describe("localizeItem", () => {
  it("returns the input unchanged for English", () => {
    expect(localizeItem(item, "en")).toBe(item);
  });

  it("returns the input unchanged when no translation exists", () => {
    expect(localizeItem(item, "fr")).toBe(item);
  });

  it("merges defined overrides over English fields", () => {
    const out = localizeItem(item, "ja");
    expect(out.title).toBe("金閣寺");
    expect(out.place).toBe("京都");
    expect(out.tag).toBe("Temple"); // untranslated falls back to English
  });

  it("ignores empty-string overrides (does not clobber English)", () => {
    expect(localizeItem(item, "ja").note).toBe("A famous gilded temple.");
  });

  it("does not mutate the input", () => {
    localizeItem(item, "ja");
    expect(item.title).toBe("Golden Pavilion");
  });
});

describe("localizeStay", () => {
  const stay: Stay = {
    name: "Hotel Granvia",
    desc: "By the station",
    note: "Cash only",
    t: { ja: { name: "ホテルグランヴィア", note: "現金のみ" } },
  };
  it("merges the translated name and keeps English desc", () => {
    const out = localizeStay(stay, "ja");
    expect(out.name).toBe("ホテルグランヴィア");
    expect(out.desc).toBe("By the station");
  });
  it("localizes the note when translated", () => {
    expect(localizeStay(stay, "ja").note).toBe("現金のみ");
  });
  it("keeps the English note when no override exists", () => {
    expect(localizeStay(stay, "fr").note).toBe("Cash only");
  });
  it("passes through for English", () => {
    expect(localizeStay(stay, "en")).toBe(stay);
  });
});

describe("localizeDayTheme", () => {
  const day = {
    date: "2026-01-01",
    theme: "Arrival",
    weather: "",
    items: [],
    stay: null,
    flights: [],
    t: { ja: { theme: "到着" } },
  } as unknown as Day;
  it("returns the translated theme", () => {
    expect(localizeDayTheme(day, "ja")).toBe("到着");
  });
  it("falls back to English theme when missing", () => {
    expect(localizeDayTheme(day, "fr")).toBe("Arrival");
  });
});
