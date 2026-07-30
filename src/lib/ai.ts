import { app } from "../firebase";
import { searchActivityImage } from "./imageSearch";
import type { Item, ItemKind, ItemTranslation, Lang } from "../types";

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

// ---------------------------------------------------------------------------
// Error reporting
// ---------------------------------------------------------------------------

/**
 * Firebase enforces App Check on every AI Logic request from 2026-11-02, and the
 * rejection arrives as an opaque 403 from deep inside the SDK. Naming the two
 * failures an admin can actually act on — an unattested browser and an exhausted
 * quota — turns those into instructions instead of a stack-trace fragment.
 */
export const AI_APPCHECK_MESSAGE =
  "This browser is not verified for AI yet. In development, register the App Check " +
  "debug token logged in the browser console; in production, check App Check is " +
  "enabled for AI Logic in the Firebase console.";

export const AI_QUOTA_MESSAGE =
  "The AI is over its quota right now. Please try again in a few minutes.";

/** Substrings Firebase uses when App Check refuses to attest a request. */
const APPCHECK_HINTS = [
  "app check",
  "appcheck",
  "app-check",
  "attestation",
  "unregistered",
  "blocked",
  "403",
  "permission-denied",
  "permission_denied",
];

const QUOTA_HINTS = [
  "429",
  "quota",
  "rate limit",
  "resource-exhausted",
  "resource_exhausted",
];

/** Searchable lower-cased text for an unknown throw: its `code` plus its message. */
function errorText(error: unknown): string {
  if (error instanceof Error) {
    const { code } = error as Error & { code?: unknown };
    const prefix = typeof code === "string" ? `${code} ` : "";
    return `${prefix}${error.message}`.toLowerCase();
  }
  return typeof error === "string" ? error.toLowerCase() : "";
}

/**
 * The actionable reason behind an AI failure, or null when it is not one we can
 * give specific advice about.
 *
 * Callers that already have their own contextual wording use this and keep their
 * message on null; callers wanting a message for every case use
 * {@link describeAiError}. Pure, so it is unit-testable.
 */
export function aiFailureReason(error: unknown): string | null {
  const text = errorText(error);
  if (APPCHECK_HINTS.some((hint) => text.includes(hint))) {
    return AI_APPCHECK_MESSAGE;
  }
  if (QUOTA_HINTS.some((hint) => text.includes(hint))) {
    return AI_QUOTA_MESSAGE;
  }
  return null;
}

/**
 * Turn anything thrown by an AI call into copy worth showing the admin.
 *
 * App Check and quota rejections get specific, actionable wording; every other
 * failure keeps the SDK's own message when it has one, and otherwise falls back
 * to the caller's per-action wording (which differs between "write a
 * description" and "find a photo").
 */
export function describeAiError(error: unknown, fallback: string): string {
  const reason = aiFailureReason(error);
  if (reason) return reason;
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }
  return fallback;
}

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

export interface DescriptionParams {
  title: string;
  /** "Dest, Country", e.g. "Kyoto, Japan". */
  dest: string;
  kind: ItemKind;
  place?: string;
}

/**
 * Per-kind content guidance. Attractions read like a self-guided tour companion
 * and meals cover food culture; stay/transport/other stay short and practical.
 */
const KIND_GUIDANCE: Record<ItemKind, string> = {
  attraction:
    "Write an educational self-guided tour companion. Cover, in this order: a short " +
    "introduction to what the place is; its history (when it came to be, why, and any key " +
    "people or events); its cultural or religious significance; and what to notice or look " +
    "out for during the visit. Use 2 to 4 short paragraphs. There is no length limit, but " +
    "every sentence must be worth reading aloud.",
  meal:
    "Write about the food culture. Explain what the dish or cuisine is, where it comes from " +
    "and any story or tradition behind it, and how locals usually enjoy it. Use 1 to 2 short paragraphs.",
  stay:
    "Write a short, practical description (2 to 3 sentences) of what kind of place this is " +
    "and what to expect on arrival.",
  transport:
    "Write a short, practical description (2 to 3 sentences) of this journey and what to expect.",
  other:
    "Write a short, practical description (2 to 3 sentences) of what this is and what to expect.",
};

/** Build the kind-adaptive "Ask AI" description prompt. Pure, so it is unit-testable. */
export function buildDescriptionPrompt({
  title,
  dest,
  kind,
  place,
}: DescriptionParams): string {
  const safeTitle = (title || "this stop").trim();
  const p = place?.trim();
  const where = p ? `${p}, ${dest}` : dest;
  return (
    `Research "${safeTitle}" in ${where} and base everything on what the place actually is — ` +
    `no invented details. ${KIND_GUIDANCE[kind] ?? KIND_GUIDANCE.other} ` +
    `The reader is an elderly traveller: warm, simple, reassuring language and short sentences. ` +
    `Plain text only — no markdown, no headings, no bullet points, no asterisks. ` +
    `Separate paragraphs with one blank line. Return only the description, with no quotes or preamble.`
  );
}

/**
 * Research an activity with Google Search and write a description adapted to
 * the item kind: attractions get an educational tour-companion write-up
 * (history, cultural significance, what to notice), meals get food-culture
 * context, and the rest a short practical blurb. Grounding keeps the details
 * factual instead of plausible-sounding invention.
 */
export async function generateActivityDescription(
  params: DescriptionParams,
): Promise<string> {
  const prompt = buildDescriptionPrompt(params);

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
    `Keep proper nouns natural for each language and keep the warm, simple tone of ` +
    `the original, written for an elderly traveller. Translate faithfully without ` +
    `shortening or summarising. Preserve paragraph breaks (blank lines) and plain ` +
    `text — no markdown. Return JSON keyed by language code, each value an ` +
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
