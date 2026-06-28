import { useEffect, useState } from "react";
import {
  PLATFORM,
  canPromptInstall,
  isAppInstalled,
  promptInstall,
  subscribe,
  type InstallOutcome,
} from "../lib/pwaInstall";

export interface PwaInstall {
  /** Native Chromium install prompt is available now (Android/desktop Chrome). */
  canInstall: boolean;
  /** Already installed / launched standalone — hide install affordances. */
  installed: boolean;
  /** iOS/iPadOS, where the user must Share → Add to Home Screen manually. */
  isIOS: boolean;
  /** Android, where install may need the browser's ⋮ menu when no prompt fired. */
  isAndroid: boolean;
  /** In-app webview that can't install — steer the user to the system browser. */
  isInAppBrowser: boolean;
  /** Fire the native prompt (resolves "unavailable" off Chromium). */
  promptInstall: () => Promise<InstallOutcome>;
}

/**
 * React view over the module-level install store in `lib/pwaInstall`. That
 * store captures `beforeinstallprompt` eagerly (before React mounts), so this
 * hook misses nothing by subscribing late.
 */
export function usePwaInstall(): PwaInstall {
  const [canInstall, setCanInstall] = useState(canPromptInstall);
  const [installed, setInstalled] = useState(isAppInstalled);

  useEffect(
    () =>
      subscribe(() => {
        setCanInstall(canPromptInstall());
        setInstalled(isAppInstalled());
      }),
    [],
  );

  return {
    canInstall,
    installed,
    isIOS: PLATFORM.isIOS,
    isAndroid: PLATFORM.isAndroid,
    isInAppBrowser: PLATFORM.isInAppBrowser,
    promptInstall,
  };
}
