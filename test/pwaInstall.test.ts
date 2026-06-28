import { describe, it, expect } from "vitest";
import {
  detectPlatform,
  resolveInstallMode,
  type Platform,
} from "../src/lib/pwaInstall";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
const IPAD =
  "Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15";
const IPADOS_DESKTOP =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120 Mobile";
const FIREFOX_ANDROID =
  "Mozilla/5.0 (Android 14; Mobile; rv:120.0) Gecko/120.0 Firefox/120.0";
const FB_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120 Mobile [FB_IAB/FB4A;FBAV/450.0;FBAN/FB4A;]";
const IG_ANDROID =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120 Mobile Instagram 300.0.0.0 Android";
const LINE_ANDROID =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120 Mobile Line/13.5.0";
const WHATSAPP =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120 Mobile WhatsApp/2.24";
const WECHAT =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120 Mobile MicroMessenger/8.0";
const FB_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 [FBAN/FBIOS;FBAV/450.0;]";
const DESKTOP_CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120";

const base = {
  maxTouchPoints: 0,
  navigatorStandalone: false,
  displayStandalone: false,
};

describe("detectPlatform", () => {
  it("flags iPhone and iPad as iOS", () => {
    expect(detectPlatform({ ...base, userAgent: IPHONE }).isIOS).toBe(true);
    expect(detectPlatform({ ...base, userAgent: IPAD }).isIOS).toBe(true);
  });

  it("flags touch-capable iPadOS (masquerading as desktop Safari) as iOS", () => {
    expect(
      detectPlatform({ ...base, userAgent: IPADOS_DESKTOP, maxTouchPoints: 5 })
        .isIOS,
    ).toBe(true);
  });

  it("does not flag a real desktop Mac (no touch) as iOS", () => {
    expect(
      detectPlatform({ ...base, userAgent: IPADOS_DESKTOP, maxTouchPoints: 0 })
        .isIOS,
    ).toBe(false);
  });

  it("does not flag Android or desktop Chrome as iOS", () => {
    expect(detectPlatform({ ...base, userAgent: ANDROID }).isIOS).toBe(false);
    expect(detectPlatform({ ...base, userAgent: DESKTOP_CHROME }).isIOS).toBe(
      false,
    );
  });

  it("reports installed when running in display-mode standalone", () => {
    expect(
      detectPlatform({ ...base, userAgent: ANDROID, displayStandalone: true })
        .isInstalled,
    ).toBe(true);
  });

  it("reports installed when navigator.standalone is set (iOS home-screen app)", () => {
    expect(
      detectPlatform({ ...base, userAgent: IPHONE, navigatorStandalone: true })
        .isInstalled,
    ).toBe(true);
  });

  it("reports not installed in a normal browser tab", () => {
    expect(detectPlatform({ ...base, userAgent: ANDROID }).isInstalled).toBe(
      false,
    );
  });

  it("flags Android (Chrome and Firefox) without misreading it as in-app or iOS", () => {
    const chrome = detectPlatform({ ...base, userAgent: ANDROID });
    expect(chrome.isAndroid).toBe(true);
    expect(chrome.isInAppBrowser).toBe(false);
    expect(chrome.isIOS).toBe(false);

    const firefox = detectPlatform({ ...base, userAgent: FIREFOX_ANDROID });
    expect(firefox.isAndroid).toBe(true);
    expect(firefox.isInAppBrowser).toBe(false);
  });

  it("flags common in-app webviews", () => {
    for (const ua of [FB_ANDROID, IG_ANDROID, LINE_ANDROID, WHATSAPP, WECHAT]) {
      expect(detectPlatform({ ...base, userAgent: ua }).isInAppBrowser).toBe(
        true,
      );
    }
  });

  it("does not flag normal browsers containing words like 'online' as in-app", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120 Mobile online deadline";
    expect(detectPlatform({ ...base, userAgent: ua }).isInAppBrowser).toBe(
      false,
    );
  });

  it("flags an iOS in-app webview as both in-app and iOS (precedence resolved later)", () => {
    const p = detectPlatform({ ...base, userAgent: FB_IOS });
    expect(p.isInAppBrowser).toBe(true);
    expect(p.isIOS).toBe(true);
  });

  it("leaves all mobile flags false on desktop Chrome", () => {
    const p = detectPlatform({ ...base, userAgent: DESKTOP_CHROME });
    expect(p.isIOS).toBe(false);
    expect(p.isAndroid).toBe(false);
    expect(p.isInAppBrowser).toBe(false);
  });
});

describe("resolveInstallMode", () => {
  const platform = (over: Partial<Platform> = {}): Platform => ({
    isIOS: false,
    isAndroid: false,
    isInAppBrowser: false,
    isInstalled: false,
    ...over,
  });

  it("returns null when already installed, even if a prompt is buffered", () => {
    expect(resolveInstallMode(platform({ isInstalled: true }), true)).toBe(
      null,
    );
  });

  it("prefers the native prompt on Android when available", () => {
    expect(resolveInstallMode(platform({ isAndroid: true }), true)).toBe(
      "prompt",
    );
  });

  it("falls back to manual menu guidance on Android with no prompt", () => {
    expect(resolveInstallMode(platform({ isAndroid: true }), false)).toBe(
      "android-manual",
    );
  });

  it("shows the iOS gesture when there is no prompt", () => {
    expect(resolveInstallMode(platform({ isIOS: true }), false)).toBe("ios");
  });

  it("steers in-app webviews to the browser, ahead of iOS and prompt", () => {
    expect(
      resolveInstallMode(
        platform({ isInAppBrowser: true, isIOS: true }),
        false,
      ),
    ).toBe("in-app");
    expect(resolveInstallMode(platform({ isInAppBrowser: true }), true)).toBe(
      "in-app",
    );
  });

  it("returns null on a desktop browser with no buffered prompt", () => {
    expect(resolveInstallMode(platform(), false)).toBe(null);
  });
});
