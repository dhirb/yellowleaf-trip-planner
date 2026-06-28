/**
 * URL safety helpers.
 *
 * Image URLs come from admin free-text input and are interpolated into CSS
 * `url("...")` backgrounds. An unsanitised value containing a quote could break
 * out of the CSS string and inject arbitrary rules, so every image URL passes
 * through `safeImageUrl` before it is rendered.
 */

/**
 * Return `raw` only if it is a well-formed `https:` URL that is safe to embed in
 * markup and CSS, otherwise `null`.
 *
 * `new URL()` normalises and percent-encodes the value (e.g. a `"` becomes
 * `%22`), so the returned `href` cannot terminate a `url("...")` context. We
 * additionally reject any residual quote/backslash/whitespace as defence in
 * depth, and require `https:` to match the Content-Security-Policy `img-src`.
 */
export function safeImageUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (/["'\\\s]/.test(url.href)) return null;
    return url.href;
  } catch {
    return null;
  }
}
