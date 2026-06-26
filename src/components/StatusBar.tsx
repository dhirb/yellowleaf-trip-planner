/** Decorative iOS-style status bar shown inside the phone frame (desktop only). */
export function StatusBar() {
  return (
    <div
      style={{
        position: "absolute",
        top: 6,
        left: 6,
        right: 6,
        height: 54,
        zIndex: 45,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 34px 0",
        boxSizing: "border-box",
        pointerEvents: "none",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 700, color: "#1F1B16", letterSpacing: 0.2 }}>9:41</div>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <svg width="19" height="12" viewBox="0 0 19 12">
          <rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" fill="#1F1B16" />
          <rect x="4.8" y="5" width="3.2" height="7" rx="0.7" fill="#1F1B16" />
          <rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7" fill="#1F1B16" />
          <rect x="14.4" y="0" width="3.2" height="12" rx="0.7" fill="#1F1B16" />
        </svg>
        <svg width="17" height="12" viewBox="0 0 17 12">
          <path
            d="M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z"
            fill="#1F1B16"
          />
          <path
            d="M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z"
            fill="#1F1B16"
          />
          <circle cx="8.5" cy="10.5" r="1.5" fill="#1F1B16" />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke="#1F1B16" strokeOpacity="0.4" fill="none" />
          <rect x="2" y="2" width="20" height="9" rx="2" fill="#1F1B16" />
          <path d="M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z" fill="#1F1B16" fillOpacity="0.4" />
        </svg>
      </div>
    </div>
  );
}
