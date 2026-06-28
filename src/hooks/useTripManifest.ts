import { useEffect } from "react";
import { buildTripManifest } from "../lib/tripManifest";

/**
 * Point the document's manifest at a trip-specific one while the traveller is
 * viewing a trip, so installing the PWA names the app after the trip and opens
 * straight to it. Restores the static manifest on unmount.
 *
 * Two platforms, two levers:
 *  - Chromium reads `<link rel="manifest">` at install time, so we swap its
 *    `href` to a freshly built blob manifest.
 *  - iOS/iPadOS ignores the manifest for "Add to Home Screen" and instead uses
 *    `apple-mobile-web-app-title` (falling back to `<title>`), so we set those
 *    to the trip title too.
 */
export function useTripManifest(tripId: string, title: string): void {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const link = document.querySelector<HTMLLinkElement>(
      'link[rel="manifest"]',
    );
    const appleTitle = document.querySelector<HTMLMetaElement>(
      'meta[name="apple-mobile-web-app-title"]',
    );

    // Snapshot what we're about to override so unmount restores the static
    // build-time values exactly.
    const prevManifestHref = link?.getAttribute("href") ?? null;
    const prevAppleTitle = appleTitle?.getAttribute("content") ?? null;
    const prevDocTitle = document.title;

    let blobUrl: string | null = null;
    if (link) {
      const manifest = buildTripManifest({
        tripId,
        title,
        origin: window.location.origin,
      });
      const blob = new Blob([JSON.stringify(manifest)], {
        type: "application/manifest+json",
      });
      blobUrl = URL.createObjectURL(blob);
      link.setAttribute("href", blobUrl);
    }

    const installName = title.trim();
    if (installName) {
      appleTitle?.setAttribute("content", installName);
      document.title = installName;
    }

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      if (link && prevManifestHref) link.setAttribute("href", prevManifestHref);
      if (appleTitle && prevAppleTitle !== null) {
        appleTitle.setAttribute("content", prevAppleTitle);
      }
      document.title = prevDocTitle;
    };
  }, [tripId, title]);
}
