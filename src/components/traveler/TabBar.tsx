import type { ReactNode } from "react";
import { ui, ACCENT, MUTED } from "../../lib/ui";

export type TravelerScreen = "day" | "calendar" | "info";

const TodayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
    <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <rect x="7" y="12" width="4" height="4" rx="1" fill="currentColor" />
  </svg>
);
const CalIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="2" />
    <path d="M3 9h18" stroke="currentColor" strokeWidth="2" />
    <circle cx="8" cy="13" r="1.3" fill="currentColor" />
    <circle cx="12" cy="13" r="1.3" fill="currentColor" />
    <circle cx="16" cy="13" r="1.3" fill="currentColor" />
    <circle cx="8" cy="17" r="1.3" fill="currentColor" />
    <circle cx="12" cy="17" r="1.3" fill="currentColor" />
  </svg>
);
const InfoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M12 11v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="7.7" r="1.3" fill="currentColor" />
  </svg>
);

function Tab({ on, onClick, icon, label }: { on: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: "2px 0",
        cursor: "pointer",
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: "0.1px",
        color: on ? ACCENT : MUTED,
        background: "none",
        border: "none",
        fontFamily: "inherit",
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function TabBar({ active, onChange }: { active: TravelerScreen; onChange: (s: TravelerScreen) => void }) {
  return (
    <div style={ui.tabbar}>
      <Tab on={active === "day"} onClick={() => onChange("day")} icon={<TodayIcon />} label="Today" />
      <Tab on={active === "calendar"} onClick={() => onChange("calendar")} icon={<CalIcon />} label="Calendar" />
      <Tab on={active === "info"} onClick={() => onChange("info")} icon={<InfoIcon />} label="Details" />
    </div>
  );
}
