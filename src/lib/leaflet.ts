/**
 * Lazy Leaflet loader.
 *
 * Leaflet (~40 KB gzipped plus its stylesheet) is only needed on the traveler's
 * Map tab, so it is dynamically imported — the same approach `ai.ts` takes with
 * the Gemini SDK — and lands in its own chunk.
 */

export type Leaflet = typeof import("leaflet");

export async function loadLeaflet(): Promise<Leaflet> {
  const [mod] = await Promise.all([
    import("leaflet"),
    import("leaflet/dist/leaflet.css"),
  ]);
  // Leaflet ships a UMD build. Bundlers expose it either as the namespace or
  // under `default`, depending on how the CommonJS interop resolves; accept both.
  const viaDefault = (mod as unknown as { default?: Leaflet }).default;
  return viaDefault ?? mod;
}
