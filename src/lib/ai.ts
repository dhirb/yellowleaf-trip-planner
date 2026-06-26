import { app } from "../firebase";
import { fallbackImage } from "./ids";

/**
 * Admin "Ask AI" assist, powered by Firebase AI Logic (Gemini Developer API backend).
 *
 * - Text descriptions use Gemini `generateContent` — works on the free Spark plan.
 * - Images use Imagen, which requires the Blaze plan; on the free tier (or any error)
 *   we fall back to a deterministic image URL so the feature never hard-fails.
 *
 * `firebase/ai` is imported dynamically so its code is only fetched on first use,
 * keeping it out of the initial bundle.
 */

const TEXT_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "imagen-3.0-generate-002";

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

/** Generate a warm, short activity description for an elderly traveller. */
export async function generateActivityDescription(title: string, dest: string): Promise<string> {
  const safeTitle = (title || "this stop").trim();
  const prompt =
    `Write a warm, simple description (2 sentences, under 40 words) of "${safeTitle}" in ${dest} ` +
    `for an elderly traveller. Plain, reassuring language. Return only the description, no quotes.`;

  const [{ getGenerativeModel }, ai] = await Promise.all([import("firebase/ai"), getAiInstance()]);
  const model = getGenerativeModel(ai, { model: TEXT_MODEL });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  if (!text) {
    throw new Error("The AI returned an empty description.");
  }
  return text.replace(/^["']|["']$/g, "");
}

/**
 * Generate an image for an activity. Returns a `data:` URL on success (Imagen),
 * or a deterministic fallback image URL when Imagen is unavailable.
 */
export async function generateActivityImage(title: string, dest: string): Promise<string> {
  const prompt = `${title || "attraction"}, ${dest}, scenic travel photograph, natural light`;
  try {
    const [{ getImagenModel }, ai] = await Promise.all([import("firebase/ai"), getAiInstance()]);
    const imagen = getImagenModel(ai, { model: IMAGE_MODEL });
    const response = await imagen.generateImages(prompt);
    const image = response.images?.[0];
    if (image?.bytesBase64Encoded) {
      const mime = image.mimeType ?? "image/png";
      return `data:${mime};base64,${image.bytesBase64Encoded}`;
    }
  } catch {
    // Imagen needs the Blaze plan / billing — fall through to the safe fallback.
  }
  return fallbackImage(title, 480, 320);
}
