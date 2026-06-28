import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Lang, Trip } from "../src/types";
import { makeTranslationHandlers } from "../src/lib/translateHandlers";
import { translateField } from "../src/lib/ai";

// Mock the AI module wholesale so the real one (and its firebase import) never
// loads — we only care that the handlers shape the map and call through.
vi.mock("../src/lib/ai", () => ({ translateField: vi.fn() }));

const langs: Lang[] = [
  { code: "ja", label: "日本語" },
  { code: "fr", label: "Français" },
];

describe("makeTranslationHandlers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("setTrans commits a single field/language override", () => {
    const commit = vi.fn((t: Trip) => t);
    const update = (fn: (t: Trip) => Trip) => fn({} as Trip);

    const { setTrans } = makeTranslationHandlers(update, commit, langs);
    setTrans("title")("ja", "金閣寺");

    expect(commit).toHaveBeenCalledWith({}, { ja: { title: "金閣寺" } });
  });

  it("translateInto maps every returned language for the field", async () => {
    vi.mocked(translateField).mockResolvedValue({
      ja: "金閣寺",
      fr: "Le Pavillon",
    });
    const commit = vi.fn((t: Trip) => t);
    const update = (fn: (t: Trip) => Trip) => fn({} as Trip);

    const { translateInto } = makeTranslationHandlers(
      update,
      commit,
      langs,
      "Kyoto, Japan",
    );
    await translateInto("title", "Kinkaku-ji")();

    expect(translateField).toHaveBeenCalledWith(
      "title",
      "Kinkaku-ji",
      langs,
      "Kyoto, Japan",
    );
    expect(commit).toHaveBeenCalledWith(
      {},
      { ja: { title: "金閣寺" }, fr: { title: "Le Pavillon" } },
    );
  });

  it("translateInto commits an empty map when nothing comes back", async () => {
    vi.mocked(translateField).mockResolvedValue({});
    const commit = vi.fn((t: Trip) => t);
    const update = (fn: (t: Trip) => Trip) => fn({} as Trip);

    const { translateInto } = makeTranslationHandlers(update, commit, langs);
    await translateInto("name", "")();

    expect(commit).toHaveBeenCalledWith({}, {});
  });
});
