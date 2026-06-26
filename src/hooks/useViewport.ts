import { useEffect, useState } from "react";

export interface Viewport {
  /** True on phone-width screens — render full-bleed instead of in a frame. */
  isMobile: boolean;
  /** Scale applied to the 402×874 mock so it fits tall-ish desktop windows. */
  phoneScale: number;
}

const PHONE_HEIGHT = 874;
const MOBILE_MAX = 480;

function compute(): Viewport {
  if (typeof window === "undefined") return { isMobile: false, phoneScale: 1 };
  const isMobile = window.innerWidth <= MOBILE_MAX;
  if (isMobile) return { isMobile, phoneScale: 1 };
  const raw = (window.innerHeight - 132) / PHONE_HEIGHT;
  const phoneScale = Math.round(Math.max(0.5, Math.min(1, raw)) * 1000) / 1000;
  return { isMobile, phoneScale };
}

/** Tracks whether we're on a phone-width screen and the desktop frame scale. */
export function useViewport(): Viewport {
  const [vp, setVp] = useState<Viewport>(compute);

  useEffect(() => {
    const onResize = () => setVp(compute());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return vp;
}
