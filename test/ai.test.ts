import { describe, it, expect } from "vitest";
import type { Item, Lang } from "../src/types";
import { pickItemFields, sanitizeTranslations } from "../src/lib/ai";

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

describe("sanitizeTranslations", () => {
  const langs: Lang[] = [
    { code: "ja", label: "日本語" },
    { code: "fr", label: "Français" },
  ];
  const fields = ["title", "note"];

  it("keeps requested codes/fields with non-empty string values", () => {
    const raw = { ja: { title: "金閣寺", note: "説明" } };
    expect(sanitizeTranslations(raw, langs, fields)).toEqual({
      ja: { title: "金閣寺", note: "説明" },
    });
  });

  it("drops unrequested language codes and unrequested fields", () => {
    const raw = {
      ja: { title: "金閣寺", extra: "x" },
      de: { title: "ignored" },
    };
    expect(sanitizeTranslations(raw, langs, fields)).toEqual({
      ja: { title: "金閣寺" },
    });
  });

  it("drops non-string and empty values, omitting empty languages", () => {
    const raw = {
      ja: { title: { nested: "bad" }, note: "" },
      fr: { title: "Le Pavillon" },
    };
    expect(sanitizeTranslations(raw, langs, fields)).toEqual({
      fr: { title: "Le Pavillon" },
    });
  });

  it("returns {} for non-object input", () => {
    expect(sanitizeTranslations(null, langs, fields)).toEqual({});
    expect(sanitizeTranslations("nope", langs, fields)).toEqual({});
  });
});
