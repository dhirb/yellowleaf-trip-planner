import type { ReactNode } from "react";
import { useViewport } from "../hooks/useViewport";
import { StatusBar } from "./StatusBar";

/**
 * Renders its children inside a phone mock on desktop, and full-bleed on phones.
 * The inner "screen" is always a flex column on `#FBF8F3`, matching the design.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  const { isMobile, phoneScale } = useViewport();

  if (isMobile) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#FBF8F3", overflow: "hidden" }}>
        <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>{children}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(120% 80% at 50% 0%, #F3EDE2 0%, #E5DDCF 60%, #DCD3C2 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "30px 16px 56px",
        gap: 22,
      }}
    >
      <div style={{ height: Math.round(874 * phoneScale), display: "flex", justifyContent: "center", flexShrink: 0 }}>
        <div
          style={{
            width: 402,
            height: 874,
            borderRadius: 52,
            position: "relative",
            background: "#1b1b1d",
            boxShadow: "0 40px 90px rgba(60,40,20,0.22), 0 0 0 2px rgba(0,0,0,0.9)",
            padding: 6,
            boxSizing: "border-box",
            flexShrink: 0,
            transform: `scale(${phoneScale})`,
            transformOrigin: "top center",
          }}
        >
          <div style={{ position: "absolute", inset: 6, borderRadius: 46, overflow: "hidden", background: "#FBF8F3" }}>
            <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
              {children}
            </div>
          </div>
          {/* Notch */}
          <div
            style={{
              position: "absolute",
              top: 17,
              left: "50%",
              transform: "translateX(-50%)",
              width: 120,
              height: 35,
              borderRadius: 22,
              background: "#000",
              zIndex: 50,
            }}
          />
          <StatusBar />
          {/* Home indicator */}
          <div
            style={{
              position: "absolute",
              bottom: 13,
              left: "50%",
              transform: "translateX(-50%)",
              width: 135,
              height: 5,
              borderRadius: 100,
              background: "rgba(0,0,0,0.28)",
              zIndex: 60,
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}
