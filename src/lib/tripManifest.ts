/**
 * Per-trip PWA manifest.
 *
 * The app ships a single static `/manifest.webmanifest` (see `vite.config.ts`),
 * but one deployment serves many trips at `/t/:tripId`. So when a traveller
 * installs *their* trip we swap in a manifest built for that trip: named after
 * the trip and opening straight to it, with a distinct `id` so Chrome treats
 * each trip as its own installable app rather than overwriting the last.
 *
 * This module is the pure builder; the DOM plumbing that injects it lives in
 * `hooks/useTripManifest`. Keeping the builder side-effect-free lets it run in
 * the Node test environment with synthetic inputs.
 */

export interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

export interface TripManifest {
  name: string;
  short_name: string;
  description: string;
  id: string;
  start_url: string;
  scope: string;
  display: "standalone";
  orientation: "portrait";
  theme_color: string;
  background_color: string;
  categories: string[];
  icons: ManifestIcon[];
}

/** Keep in step with the static manifest in `vite.config.ts`. */
const THEME_COLOR = "#C2541F";
const BACKGROUND_COLOR = "#E5DDCF";

/** Root-relative icon paths, made absolute per-build against the origin. */
const ICON_PATHS: ManifestIcon[] = [
  {
    src: "icons/pwa-192x192.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "icons/pwa-512x512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "icons/maskable-512x512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
];

/** Used when a trip somehow has no title yet (drafts, mid-edit reads). */
const FALLBACK_NAME = "Trip Planner";

/**
 * `short_name` is shown under the home-screen icon, where space is tight; the
 * Web App Manifest spec suggests keeping it to ~12 characters.
 */
const SHORT_NAME_MAX = 12;

function toShortName(name: string): string {
  if (name.length <= SHORT_NAME_MAX) return name;
  // Trim back to a word boundary when one is reasonably close, else hard-cut,
  // so we avoid a stray trailing space or a word sliced mid-syllable.
  const clipped = name.slice(0, SHORT_NAME_MAX).trimEnd();
  const lastSpace = clipped.lastIndexOf(" ");
  return lastSpace >= SHORT_NAME_MAX - 4
    ? clipped.slice(0, lastSpace)
    : clipped;
}

/**
 * Build a manifest tailored to a single trip. URLs are absolute against
 * `origin` because a `blob:` manifest cannot resolve relative member URLs.
 */
export function buildTripManifest(input: {
  tripId: string;
  title: string;
  origin: string;
}): TripManifest {
  const origin = input.origin.replace(/\/$/, "");
  const name = input.title.trim() || FALLBACK_NAME;

  return {
    name,
    short_name: toShortName(name),
    description: `${name} — your travel itinerary.`,
    // A path id is resolved relative to the start_url's origin and uniquely
    // identifies the installed app.
    id: `/t/${input.tripId}`,
    start_url: `${origin}/t/${input.tripId}`,
    scope: `${origin}/`,
    display: "standalone",
    orientation: "portrait",
    theme_color: THEME_COLOR,
    background_color: BACKGROUND_COLOR,
    categories: ["travel", "lifestyle"],
    icons: ICON_PATHS.map((icon) => ({
      ...icon,
      src: `${origin}/${icon.src}`,
    })),
  };
}
