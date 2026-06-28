import { Download, ExternalLink, MoreVertical, Share, X } from "lucide-react";
import { usePwaInstall } from "../../hooks/usePwaInstall";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { resolveInstallMode, type InstallMode } from "../../lib/pwaInstall";
import { ui } from "../../lib/ui";
import { cn } from "../../lib/cn";

const DISMISS_KEY = "yl:installDismissed";

/** The accent icon + sub-copy shown beneath the headline, per install mode. */
function InstallHint({ mode }: { mode: InstallMode }) {
  const hint = "mt-[2px] text-caption font-semibold leading-[1.4] text-faint";
  const inlineHint = cn(hint, "flex flex-wrap items-center gap-1");
  const accentIcon = { size: 14, strokeWidth: 2.4, className: "text-accent" };
  switch (mode) {
    case "prompt":
      return (
        <div className={hint}>
          Full-screen, offline access on your home screen.
        </div>
      );
    case "ios":
      // iOS (no programmatic install): show the manual gesture.
      return (
        <div className={inlineHint}>
          <span>Tap</span>
          <Share {...accentIcon} />
          <span>then “Add to Home Screen”.</span>
        </div>
      );
    case "android-manual":
      // Chrome on Android can install from its menu even when no prompt fired.
      return (
        <div className={inlineHint}>
          <span>Open the menu</span>
          <MoreVertical {...accentIcon} />
          <span>then “Install app” / “Add to Home screen”.</span>
        </div>
      );
    case "in-app":
      // In-app webviews can't install at all — guide the user to a real browser.
      return (
        <div className={inlineHint}>
          <span>This in-app browser can’t install apps. Tap</span>
          <MoreVertical {...accentIcon} />
          <span>then “Open in browser”.</span>
        </div>
      );
  }
}

/**
 * Icon chip + headline + a per-mode call to action, shared by the dismissible
 * banner and the always-available Settings card. Only the native-prompt mode
 * gets a one-tap Install button; every other mode shows manual guidance so no
 * mobile visitor is left without a path to the home screen.
 */
function InstallBody({
  mode,
  onInstall,
}: {
  mode: InstallMode;
  onInstall: () => void;
}) {
  const isInApp = mode === "in-app";
  return (
    <>
      <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[14px] bg-accent-soft text-accent">
        {isInApp ? (
          <ExternalLink size={22} strokeWidth={2.2} />
        ) : (
          <Download size={22} strokeWidth={2.2} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-body font-extrabold tracking-[-0.2px]">
          {isInApp ? "Open in your browser" : "Install Yellowleaf"}
        </div>
        <InstallHint mode={mode} />
      </div>
      {mode === "prompt" && (
        <button
          onClick={onInstall}
          className="h-[40px] shrink-0 cursor-pointer rounded-[12px] border-none bg-accent px-[16px] text-small font-bold text-white shadow-accent"
        >
          Install
        </button>
      )}
    </>
  );
}

/**
 * A calm, dismissible nudge to install the itinerary as an app. Shown on the
 * browsing screens; dismissal is remembered per-device so it never nags (the
 * Settings card remains as a permanent path). Renders nothing when there is no
 * install path on this browser or the app is already installed.
 */
export function InstallPrompt() {
  const {
    canInstall,
    installed,
    isIOS,
    isAndroid,
    isInAppBrowser,
    promptInstall,
  } = usePwaInstall();
  // Dismissal is remembered per-device (stored as "1") so the banner never nags.
  const [dismissed, setDismissed] = useLocalStorage<boolean>(
    DISMISS_KEY,
    false,
    (raw) => raw === "1",
    (v) => (v ? "1" : "0"),
  );

  const mode = resolveInstallMode(
    { isIOS, isAndroid, isInAppBrowser, isInstalled: installed },
    canInstall,
  );
  if (mode === null || dismissed) return null;

  const dismiss = () => setDismissed(true);

  return (
    <div className="shrink-0 px-[14px] pb-[10px]">
      <div className={cn(ui.card, "flex items-center gap-[12px] p-[13px]")}>
        <InstallBody mode={mode} onInstall={() => void promptInstall()} />
        <button
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="shrink-0 cursor-pointer self-start rounded-full p-[2px] text-faint"
        >
          <X size={18} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

/**
 * The permanent install entry on the Settings screen, so travelers who
 * dismissed the banner can still install. Renders nothing once installed.
 */
export function InstallCard() {
  const {
    canInstall,
    installed,
    isIOS,
    isAndroid,
    isInAppBrowser,
    promptInstall,
  } = usePwaInstall();

  const mode = resolveInstallMode(
    { isIOS, isAndroid, isInAppBrowser, isInstalled: installed },
    canInstall,
  );
  if (mode === null) return null;

  return (
    <div className={cn(ui.padCard, "mb-4")}>
      <div className="mb-[10px] text-tag font-extrabold uppercase tracking-[0.6px] text-faint">
        App
      </div>
      <div className="flex items-center gap-[14px]">
        <InstallBody mode={mode} onInstall={() => void promptInstall()} />
      </div>
    </div>
  );
}
