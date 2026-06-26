import { useState } from "react";
import { ui } from "../../lib/ui";

interface LockScreenProps {
  title: string;
  onUnlock: (code: string) => boolean;
}

/** Access-code gate shown for private trips. */
export function LockScreen({ title, onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const attempt = () => {
    const ok = onUnlock(pin);
    setError(ok ? "" : "That code is not right. Try again.");
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 30px",
        textAlign: "center",
        background: "linear-gradient(180deg, #FBF8F3 0%, #F4E9DC 100%)",
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: 28,
          background: "#C2541F",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 16px 36px rgba(194,84,31,0.32)",
        }}
      >
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="11" width="16" height="10" rx="3" stroke="#fff" strokeWidth="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="16" r="1.6" fill="#fff" />
        </svg>
      </div>
      <div style={{ fontSize: 25, fontWeight: 800, marginTop: 26, letterSpacing: "-0.3px" }}>This trip is private</div>
      <div style={{ fontSize: 16, color: "#8A8175", fontWeight: 500, marginTop: 8, lineHeight: 1.4 }}>
        Enter the access code to view
        <br />
        {title}
      </div>
      <input
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && attempt()}
        placeholder="Trip code"
        aria-label="Trip access code"
        style={{ ...ui.input, marginTop: 28, textAlign: "center", fontSize: 19, fontWeight: 700, letterSpacing: "1px", height: 58 }}
      />
      <div style={{ color: "#C0392B", fontSize: 14, fontWeight: 600, height: 20, marginTop: 8 }}>{error}</div>
      <button onClick={attempt} style={{ ...ui.btnPrimary, marginTop: 6 }}>
        Unlock itinerary
      </button>
      <div style={{ fontSize: 13.5, color: "#B0A693", fontWeight: 600, marginTop: 18 }}>
        Hint: ask the person who shared this trip for the code.
      </div>
    </div>
  );
}
