import { useEffect, useState } from "react";

/**
 * Track the browser's online/offline state.
 *
 * `navigator.onLine` is only roughly accurate — `true` means "has a network
 * interface", not "the internet is reachable" — but that is the right amount of
 * signal for our use: we only use it to decide whether to show an offline
 * fallback message instead of an infinite spinner. A false positive simply
 * leaves the normal spinner in place, which degrades safely.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}
