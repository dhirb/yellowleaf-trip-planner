import { describe, it, expect } from "vitest";
import type { Item, ItemKind, Lang } from "../src/types";
import {
  buildDescriptionPrompt,
  pickItemFields,
  sanitizeTranslations,
  translateField,
} from "../src/lib/ai";

describe("buildDescriptionPrompt", () => {
  const base = { title: "Kinkaku-ji", dest: "Kyoto, Japan" } as const;

  it("gives attractions tour-companion guidance with no length cap", () => {
    const prompt = buildDescriptionPrompt({ ...base, kind: "attraction" });
    expect(prompt).toContain("history");
    expect(prompt).toContain("cultural");
    expect(prompt).toContain("notice");
    expect(prompt).not.toContain("under 40 words");
  });

  it("gives meals food-culture guidance", () => {
    const prompt = buildDescriptionPrompt({ ...base, kind: "meal" });
    expect(prompt).toContain("food culture");
  });

  it.each(["stay", "transport", "other"] as ItemKind[])(
    "keeps %s short and practical",
    (kind) => {
      const prompt = buildDescriptionPrompt({ ...base, kind });
      expect(prompt).toContain("2 to 3 sentences");
    },
  );

  it("folds the place into the research location", () => {
    const prompt = buildDescriptionPrompt({
      ...base,
      kind: "attraction",
      place: "Gion",
    });
    expect(prompt).toContain('"Kinkaku-ji" in Gion, Kyoto, Japan');
  });

  it("omits a blank or absent place without a dangling comma", () => {
    const absent = buildDescriptionPrompt({ ...base, kind: "attraction" });
    const blank = buildDescriptionPrompt({
      ...base,
      kind: "attraction",
      place: "  ",
    });
    for (const prompt of [absent, blank]) {
      expect(prompt).toContain('"Kinkaku-ji" in Kyoto, Japan');
      expect(prompt).not.toContain("undefined");
    }
  });

  it('falls back to "this stop" for a blank title', () => {
    const prompt = buildDescriptionPrompt({
      title: "",
      dest: "Kyoto, Japan",
      kind: "attraction",
    });
    expect(prompt).toContain('"this stop"');
  });

  it.each(["attraction", "meal", "stay", "transport", "other"] as ItemKind[])(
    "keeps the plain-text rendering contract for %s",
    (kind) => {
      const prompt = buildDescriptionPrompt({ ...base, kind });
      expect(prompt).toContain("no markdown");
      expect(prompt).toContain("blank line");
    },
  );
});

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

describe("translateField", () => {
  const langs: Lang[] = [{ code: "ja", label: "日本語" }];

  it("short-circuits to {} for a blank value without calling the model", async () => {
    await expect(translateField("title", "   ", langs)).resolves.toEqual({});
  });

  it("short-circuits to {} when there are no target languages", async () => {
    await expect(translateField("title", "Kinkaku-ji", [])).resolves.toEqual(
      {},
    );
  });
});
