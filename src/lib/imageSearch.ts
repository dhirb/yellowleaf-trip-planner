/**
 * Wikimedia image lookup for activity thumbnails.
 *
 * Named attractions almost always have a Wikipedia page with a lead photo, so
 * we search Wikipedia for the activity and return that page's image. This needs
 * no API key, no quota signup, and is CORS-enabled (`origin=*`), so there is
 * nothing to configure or bill.
 *
 * When nothing matching is found we return null, and the caller leaves the
 * thumbnail blank rather than inventing an image. See src/lib/ai.ts.
 */

const ENDPOINT = "https://en.wikipedia.org/w/api.php";

/** Thumbnail size (px) requested from Wikimedia; comfortably covers our banners. */
const THUMB_SIZE = 640;

/** How many top search hits to scan for one that actually has a photo. */
const SEARCH_LIMIT = 3;

/** Minimal shape of the `generator=search` + `prop=pageimages` response. */
interface WikiPage {
  index?: number;
  thumbnail?: { source?: string };
}
interface WikiResponse {
  query?: { pages?: Record<string, WikiPage> };
}

/**
 * Find a real photo for an activity. Returns an HTTPS image URL on success, or
 * null when the search errors or finds no page with an image.
 *
 * We never throw — a failed lookup simply means "no result", letting the caller
 * leave the thumbnail blank.
 */
export async function searchActivityImage(
  title: string,
  dest: string,
): Promise<string | null> {
  const query = [title, dest]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(" ");
  if (!query) return null;

  // `generator=search` finds the best-matching articles (fuzzy), and
  // `prop=pageimages` returns each one's lead photo in a single request.
  // `origin=*` opts into anonymous CORS so the browser can call it directly.
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: query,
    gsrlimit: String(SEARCH_LIMIT),
    prop: "pageimages",
    piprop: "thumbnail",
    pithumbsize: String(THUMB_SIZE),
    origin: "*",
  });

  try {
    const res = await fetch(`${ENDPOINT}?${params}`);
    if (!res.ok) return null;
    const data = (await res.json()) as WikiResponse;

    const pages = Object.values(data.query?.pages ?? {});
    if (pages.length === 0) return null;

    // Respect search ranking: the top hit may lack a photo while the next has
    // one, so scan in rank order and take the first usable thumbnail.
    pages.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    for (const page of pages) {
      const src = page.thumbnail?.source?.trim();
      if (src && src.startsWith("https://")) return src;
    }
    return null;
  } catch {
    return null;
  }
}
