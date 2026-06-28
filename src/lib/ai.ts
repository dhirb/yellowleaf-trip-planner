import { app } from "../firebase";
import { searchActivityImage } from "./imageSearch";
import type { Item, ItemTranslation, Lang } from "../types";

/**
 * Admin "Ask AI" assist, powered by Firebase AI Logic (Gemini Developer API backend).
 *
 * - Descriptions use Gemini `generateContent` grounded with Google Search, so the
 *   model researches the real attraction instead of inventing details. Works on
 *   the free Spark plan.
 * - Thumbnails come from an image search for a real photo of the place. When the
 *   search finds nothing, we return null and the thumbnail is left blank — we do
 *   not invent an AI-generated stand-in.
 *
 * `firebase/ai` is imported dynamically so its code is only fetched on first use,
 * keeping it out of the initial bundle.
 */

const TEXT_MODEL = "gemini-2.5-flash";

/** Lazily create (and memoise) the Firebase AI instance. */
let aiPromise: Promise<import("firebase/ai").AI> | null = null;
async function getAiInstance() {
  if (!aiPromise) {
    aiPromise = import("firebase/ai").then(({ getAI, GoogleAIBackend }) =>
      getAI(app, { backend: new GoogleAIBackend() }),
    );
  }
  return aiPromise;
}

/**
 * Research an activity with Google Search and write a warm, short description
 * for an elderly traveller. Grounding keeps the details factual (real opening
 * context, what the place actually is) instead of plausible-sounding invention.
 */
export async function generateActivityDescription(
  title: string,
  dest: string,
): Promise<string> {
  const safeTitle = (title || "this stop").trim();
  const prompt =
    `Research "${safeTitle}" in ${dest} and write a warm, simple description ` +
    `(2 sentences, under 40 words) for an elderly traveller. Base it on what the ` +
    `place actually is. Plain, reassuring language. Return only the description, no quotes.`;

  const [{ getGenerativeModel }, ai] = await Promise.all([
    import("firebase/ai"),
    getAiInstance(),
  ]);
  // The `googleSearch` tool lets Gemini look the attraction up before answering.
  const model = getGenerativeModel(ai, {
    model: TEXT_MODEL,
    tools: [{ googleSearch: {} }],
  });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  if (!text) {
    throw new Error("The AI returned an empty description.");
  }
  return text.replace(/^["']|["']$/g, "");
}

/**
 * Find a real photo for an activity via image search. Returns the photo URL, or
 * null when nothing is found — in which case the caller leaves the thumbnail
 * blank rather than inventing an AI-generated image.
 *
 * This stays the single seam for thumbnail sourcing, so swapping or layering
 * image providers (Wikimedia, Openverse, …) only touches src/lib/imageSearch.ts.
 */
export async function generateActivityImage(
  title: string,
  dest: string,
): Promise<string | null> {
  return searchActivityImage(title, dest);
}

// ---------------------------------------------------------------------------
// Translation helpers
// ---------------------------------------------------------------------------

const TRANSLATE_MODEL = "gemini-2.5-flash";
const ITEM_FIELDS = ["title", "note", "place", "tag", "tip"] as const;

/** The activity's non-empty translatable fields, trimmed. */
export function pickItemFields(item: Item): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of ITEM_FIELDS) {
    const v = (item[f] ?? "").trim();
    if (v) out[f] = v;
  }
  return out;
}

/**
 * Translate a flat map of fields into every target language in one call.
 * Returns a map keyed by language code → { field: translation }. Resolves to
 * {} (no API call) when there are no fields or no target languages.
 */
async function translateFields(
  fields: Record<string, string>,
  langs: Lang[],
  context?: string,
): Promise<Record<string, Record<string, string>>> {
  const fieldKeys = Object.keys(fields);
  if (langs.length === 0 || fieldKeys.length === 0) return {};

  const [{ getGenerativeModel }, ai] = await Promise.all([
    import("firebase/ai"),
    getAiInstance(),
  ]);

  // JSON mode forces a bare JSON object back, so the model can't wrap the
  // result in prose or markdown fences that would defeat JSON.parse below.
  const model = getGenerativeModel(ai, {
    model: TRANSLATE_MODEL,
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt =
    `Translate these travel itinerary fields into the target languages. ` +
    `${context ? `Context: ${context}. ` : ""}` +
    `Keep proper nouns natural for each language and keep wording concise and warm ` +
    `for an elderly traveller. Return JSON keyed by language code, each value an ` +
    `object using the same field keys.\n` +
    `Target languages: ${langs.map((l) => `${l.code} (${l.label})`).join(", ")}.\n` +
    `Fields:\n${JSON.stringify(fields, null, 2)}`;

  const result = await model.generateContent(prompt);
  const text = result.response
    .text()
    .trim()
    .replace(/^```json\s*|\s*```$/g, "");
  if (!text) return {};

  // The model output is untrusted: only keep the languages we asked for, and
  // within each only the requested fields whose value is a non-empty string.
  // This prevents malformed responses (objects, wrong keys, blanks) from
  // reaching the trip and the traveler view.
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {};
  }
  return sanitizeTranslations(parsed, langs, fieldKeys);
}

/** Keep only requested language codes, requested fields, and non-empty strings. */
export function sanitizeTranslations(
  parsed: unknown,
  langs: Lang[],
  fieldKeys: string[],
): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  if (typeof parsed !== "object" || parsed === null) return out;
  const root = parsed as Record<string, unknown>;
  for (const { code } of langs) {
    const entry = root[code];
    if (typeof entry !== "object" || entry === null) continue;
    const fields = entry as Record<string, unknown>;
    const clean: Record<string, string> = {};
    for (const key of fieldKeys) {
      const value = fields[key];
      if (typeof value === "string" && value.trim() !== "") clean[key] = value;
    }
    if (Object.keys(clean).length > 0) out[code] = clean;
  }
  return out;
}

/**
 * Translate a single field's value into every target language. Returns a flat
 * map of language code → translated string (only languages the model returned a
 * usable value for). Resolves to {} without an API call when the value is blank.
 *
 * This powers the per-field "Translate with AI" button in the edit sheet; it
 * reuses {@link translateFields} so sanitisation and prompting stay in one place.
 */
export async function translateField(
  field: string,
  value: string,
  langs: Lang[],
  context?: string,
): Promise<Record<string, string>> {
  const v = value.trim();
  if (!v) return {};
  const map = await translateFields({ [field]: v }, langs, context);
  const out: Record<string, string> = {};
  for (const code of Object.keys(map)) {
    const fv = map[code][field];
    if (typeof fv === "string") out[code] = fv;
  }
  return out;
}

/** Translate an activity's fields into every target language. */
export async function translateItem(
  item: Item,
  langs: Lang[],
  dest: string,
): Promise<Record<string, ItemTranslation>> {
  return (await translateFields(pickItemFields(item), langs, dest)) as Record<
    string,
    ItemTranslation
  >;
}
