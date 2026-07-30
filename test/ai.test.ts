import { describe, it, expect } from "vitest";
import type { Item, ItemKind, Lang } from "../src/types";
import {
  AI_APPCHECK_MESSAGE,
  AI_QUOTA_MESSAGE,
  aiFailureReason,
  buildDescriptionPrompt,
  describeAiError,
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

describe("describeAiError", () => {
  const FALLBACK = "AI could not generate a description.";

  it("explains an App Check rejection instead of echoing the SDK", () => {
    // Arrange
    const error = new Error(
      "AI: Error fetching from https://firebasevertexai.googleapis.com: " +
        "Firebase App Check token is invalid.",
    );

    // Act
    const message = describeAiError(error, FALLBACK);

    // Assert
    expect(message).toBe(AI_APPCHECK_MESSAGE);
  });

  it("treats a 403 permission-denied code as an App Check rejection", () => {
    const error = Object.assign(new Error("Request had insufficient scopes"), {
      code: "permission-denied",
    });

    expect(describeAiError(error, FALLBACK)).toBe(AI_APPCHECK_MESSAGE);
  });

  it("recognises a request blocked by an enforced backend", () => {
    const error = new Error(
      "Requests from this Firebase App are blocked. (403)",
    );

    expect(describeAiError(error, FALLBACK)).toBe(AI_APPCHECK_MESSAGE);
  });

  it("reports quota exhaustion separately from attestation", () => {
    const error = Object.assign(new Error("Too many requests"), {
      code: "resource-exhausted",
    });

    expect(describeAiError(error, FALLBACK)).toBe(AI_QUOTA_MESSAGE);
  });

  it("keeps the SDK message for an unrelated failure", () => {
    const error = new Error("The AI returned an empty description.");

    expect(describeAiError(error, FALLBACK)).toBe(
      "The AI returned an empty description.",
    );
  });

  it("falls back to the caller's wording for a non-Error throw", () => {
    expect(describeAiError(undefined, FALLBACK)).toBe(FALLBACK);
    expect(describeAiError(new Error("   "), FALLBACK)).toBe(FALLBACK);
  });
});

describe("aiFailureReason", () => {
  it("names the causes an admin can act on", () => {
    expect(aiFailureReason(new Error("App Check token is invalid"))).toBe(
      AI_APPCHECK_MESSAGE,
    );
    expect(aiFailureReason(new Error("Quota exceeded (429)"))).toBe(
      AI_QUOTA_MESSAGE,
    );
  });

  it("returns null for anything else, so callers keep their own wording", () => {
    expect(aiFailureReason(new Error("The model timed out"))).toBeNull();
    expect(aiFailureReason(undefined)).toBeNull();
  });
});
