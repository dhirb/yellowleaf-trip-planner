import type { CSSProperties } from "react";
import type { Trip } from "../../types";
import { rangeLabel } from "../../lib/date";
import { ui } from "../../lib/ui";
import { Chevron } from "../../lib/icons";

interface TripsListProps {
  trips: Trip[];
  loading: boolean;
  onOpen: (id: string) => void;
  onNew: () => void;
  onSignOut: () => void;
}

function statusOf(tr: Trip): { label: string; color: string; bg: string } {
  if (!tr.published) return { label: "Draft", color: "#B5830F", bg: "#FBF1D9" };
  if (tr.visibility === "public") return { label: "Live · Public", color: "#2F7D5B", bg: "#DEF0E6" };
  return { label: "Live · Private", color: "#3B5B8C", bg: "#E1E9F4" };
}

export function TripsList({ trips, loading, onOpen, onNew, onSignOut }: TripsListProps) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#FBF8F3" }}>
      <div style={{ padding: "54px 18px 14px", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-0.5px" }}>Your trips</div>
          <div style={{ fontSize: 14.5, color: "#8A8175", fontWeight: 500, marginTop: 2 }}>Tap a trip to edit</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onSignOut}
            style={{ background: "none", border: "none", color: "#B0A693", fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit" }}
          >
            Sign out
          </button>
          <button
            onClick={onNew}
            aria-label="New trip"
            style={{
              width: 50,
              height: 50,
              borderRadius: 16,
              background: "#C2541F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              border: "none",
              boxShadow: "0 8px 18px rgba(194,84,31,0.3)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="no-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", padding: "6px 18px 26px" }}>
        {loading && <div style={{ color: "#A89F92", fontWeight: 600, padding: "20px 4px" }}>Loading your trips…</div>}

        {!loading && trips.length === 0 && (
          <div style={{ ...ui.padCard, textAlign: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>No trips yet</div>
            <div style={{ fontSize: 14.5, color: "#8A8175", fontWeight: 500, marginTop: 6, lineHeight: 1.4 }}>
              Tap the + button to create your first itinerary.
            </div>
          </div>
        )}

        {trips.map((tr) => {
          const st = statusOf(tr);
          const coverStyle: CSSProperties = {
            width: 50,
            height: 50,
            borderRadius: 14,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            fontWeight: 800,
            color: "#fff",
            background: tr.cover,
          };
          return (
            <button
              key={tr.id}
              onClick={() => onOpen(tr.id)}
              style={{ ...ui.padCard, marginBottom: 14, cursor: "pointer", display: "flex", gap: 14, alignItems: "center", width: "100%", textAlign: "left", fontFamily: "inherit" }}
            >
              <div style={coverStyle}>{(tr.dest || "?")[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: st.color, background: st.bg, padding: "4px 11px", borderRadius: 999 }}>
                  {st.label}
                </span>
                <div style={{ fontSize: 18, fontWeight: 700, margin: "5px 0 2px", letterSpacing: "-0.2px" }}>{tr.title}</div>
                <div style={{ fontSize: 14, color: "#8A8175", fontWeight: 600 }}>
                  {tr.dest}
                  {tr.country ? `, ${tr.country}` : ""} · {rangeLabel(tr.days[0].date, tr.days[tr.days.length - 1].date)}
                </div>
              </div>
              <Chevron dir="right" size={14} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
