/**
 * PWA install plumbing.
 *
 * Chrome fires `beforeinstallprompt` once, early — often before React has even
 * mounted — and that event is the *only* handle that lets us trigger the native
 * install flow later. So we capture it at module load (this module is imported
 * for its side effects from `main.tsx`) and buffer it behind a tiny
 * subscribe/snapshot store that `usePwaInstall` reads. iOS Safari never fires
 * the event and exposes no programmatic install API, so there we fall back to
 * "Add to Home Screen" instructions instead.
 */

/** The non-standard event Chromium fires to offer installation. */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

export interface Platform {
  /** iOS/iPadOS, where install means a manual Share → Add to Home Screen. */
  isIOS: boolean;
  /** Android, where Chrome can install via the prompt or its ⋮ menu. */
  isAndroid: boolean;
  /**
   * Running inside an in-app webview (Facebook/Instagram/LINE/WhatsApp/WeChat,
   * etc.). These never fire `beforeinstallprompt` and cannot install a PWA at
   * all, so the only useful guidance is "open in the system browser".
   */
  isInAppBrowser: boolean;
  /** Already running as an installed, standalone app. */
  isInstalled: boolean;
}

/**
 * Pure platform probe — kept free of globals so it can be unit-tested with
 * synthetic inputs.
 */
export function detectPlatform(input: {
  userAgent: string;
  maxTouchPoints: number;
  navigatorStandalone: boolean;
  displayStandalone: boolean;
}): Platform {
  const ua = input.userAgent.toLowerCase();
  // iPadOS 13+ masquerades as desktop Safari ("Macintosh"), so treat a
  // touch-capable Mac as iOS for install-instruction purposes.
  const isIPadOS = ua.includes("macintosh") && input.maxTouchPoints > 1;
  const isIOS = /iphone|ipad|ipod/.test(ua) || isIPadOS;
  const isAndroid = ua.includes("android");
  // In-app webview markers. Collision-prone tokens are anchored: "line/" avoids
  // matching "online"/"deadline"; "fban"/"fbav" are bounded so they don't match
  // inside longer words.
  const isInAppBrowser =
    /\bfban\b|\bfbav\b|fb_iab|instagram|line\/|whatsapp|micromessenger|twitter/.test(
      ua,
    );
  const isInstalled = input.displayStandalone || input.navigatorStandalone;
  return { isIOS, isAndroid, isInAppBrowser, isInstalled };
}

function probePlatform(): Platform {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return {
      isIOS: false,
      isAndroid: false,
      isInAppBrowser: false,
      isInstalled: false,
    };
  }
  return detectPlatform({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    navigatorStandalone:
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
    displayStandalone:
      window.matchMedia?.("(display-mode: standalone)").matches ?? false,
  });
}

/** Static, computed once: the user agent does not change mid-session. */
export const PLATFORM: Platform = probePlatform();

/** Which install affordance to surface. */
export type InstallMode = "prompt" | "ios" | "android-manual" | "in-app";

/**
 * Resolve which install affordance to show, or `null` when there is no useful
 * guidance to give (already installed, or a desktop browser that has not
 * buffered a prompt). Pure so the precedence is unit-testable.
 *
 * In-app webviews are handled before `canInstall` because they never fire
 * `beforeinstallprompt` and cannot install at all — even on iOS — so the only
 * actionable advice is to reopen in the system browser.
 */
export function resolveInstallMode(
  platform: Platform,
  canInstall: boolean,
): InstallMode | null {
  if (platform.isInstalled) return null;
  if (platform.isInAppBrowser) return "in-app";
  if (canInstall) return "prompt";
  if (platform.isIOS) return "ios";
  if (platform.isAndroid) return "android-manual";
  return null;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = PLATFORM.isInstalled;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    // Suppress Chrome's default mini-infobar; we surface our own affordance.
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installed = true;
    emit();
  });
}

/** Subscribe to install-state changes; returns an unsubscribe function. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Whether the native Chromium install prompt is available right now. */
export function canPromptInstall(): boolean {
  return deferredPrompt !== null;
}

/** Whether the app is already installed / running standalone. */
export function isAppInstalled(): boolean {
  return installed;
}

/**
 * Trigger the native install prompt. Resolves with the user's choice, or
 * "unavailable" when no prompt is buffered (iOS, already installed, or the
 * event simply has not fired). The deferred event is single-use, so it is
 * cleared as soon as it is consumed.
 *
 * `event.prompt()` must run inside the user gesture, so callers must invoke
 * this directly from an event handler (no awaited work beforehand).
 */
export async function promptInstall(): Promise<InstallOutcome> {
  if (!deferredPrompt) return "unavailable";
  const event = deferredPrompt;
  deferredPrompt = null;
  emit();
  await event.prompt();
  const choice = await event.userChoice;
  return choice.outcome;
}
