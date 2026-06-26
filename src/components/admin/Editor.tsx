import { useState } from "react";
import { useTripEditor } from "../../hooks/useTripEditor";
import { generateActivityDescription, generateActivityImage } from "../../lib/ai";
import { setItemContent } from "../../lib/editTrip";
import { ui, seg } from "../../lib/ui";
import { DaysTab } from "./DaysTab";
import { SettingsTab } from "./SettingsTab";

interface EditorProps {
  tripId: string;
  onBack: () => void;
  onPreview: (tripId: string) => void;
  showToast: (msg: string) => void;
}

export function Editor({ tripId, onBack, onPreview, showToast }: EditorProps) {
  const editor = useTripEditor(tripId);
  const [tab, setTab] = useState<"days" | "settings">("days");
  const [adminDay, setAdminDay] = useState(0);
  const [aiBusyKey, setAiBusyKey] = useState("");

  const { trip, loading, saving, update, set, publish } = editor;

  if (loading) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#A89F92", fontWeight: 600, background: "#FBF8F3" }}>
        Loading trip…
      </div>
    );
  }
  if (!trip) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 30, textAlign: "center", background: "#FBF8F3" }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>That trip could not be loaded.</div>
        <button onClick={onBack} style={{ ...ui.btnGhost, width: "auto", padding: "0 20px" }}>
          Back to trips
        </button>
      </div>
    );
  }

  const dayCount = trip.days.length;
  const goDay = (i: number) => setAdminDay(Math.max(0, Math.min(dayCount - 1, i)));

  const askAI = async (di: number, ii: number) => {
    const key = `${di}-${ii}`;
    setAiBusyKey(key);
    const item = trip.days[di].items[ii];
    const dest = `${trip.dest}, ${trip.country}`;
    try {
      const [note, image] = await Promise.all([
        generateActivityDescription(item.title, dest),
        generateActivityImage(item.title, dest),
      ]);
      update((t) => setItemContent(t, di, ii, { note, image }));
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "AI could not generate content. Check Firebase AI Logic is enabled.");
    } finally {
      setAiBusyKey("");
    }
  };

  const handlePublish = async () => {
    await publish();
    showToast("Published — travelers now see the latest itinerary.");
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#FBF8F3" }}>
      <div style={{ padding: "54px 16px 12px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} aria-label="Back to trips" style={{ ...ui.chevBtn, width: 44, height: 44, fontFamily: "inherit" }}>
          <svg width="11" height="18" viewBox="0 0 12 20" fill="none">
            <path d="M10 2L2 10l8 8" stroke="#7A6F60" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ flex: 1, fontSize: 20, fontWeight: 800, letterSpacing: "-0.3px", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          Edit trip
          {saving && <span style={{ fontSize: 12, fontWeight: 600, color: "#B0A693", marginLeft: 8 }}>saving…</span>}
        </div>
        <button onClick={handlePublish} style={{ background: "#C2541F", color: "#fff", border: "none", fontFamily: "inherit", fontSize: 15, fontWeight: 800, padding: "11px 18px", borderRadius: 13, cursor: "pointer", boxShadow: "0 6px 14px rgba(194,84,31,0.28)" }}>
          Publish
        </button>
      </div>

      <div style={{ padding: "4px 18px 12px", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 4, background: "#F0E9DE", padding: 4, borderRadius: 14 }}>
          <button onClick={() => setTab("days")} style={{ ...seg(tab === "days"), border: "none", fontFamily: "inherit" }}>
            Itinerary
          </button>
          <button onClick={() => setTab("settings")} style={{ ...seg(tab === "settings"), border: "none", fontFamily: "inherit" }}>
            Settings
          </button>
        </div>
      </div>

      <div className="no-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", padding: "4px 18px 26px" }}>
        {tab === "days" ? (
          <DaysTab
            trip={trip}
            dayIndex={adminDay}
            onSelectDay={goDay}
            onPrevDay={() => goDay(adminDay - 1)}
            onNextDay={() => goDay(adminDay + 1)}
            update={update}
            onAskAI={askAI}
            aiBusyKey={aiBusyKey}
          />
        ) : (
          <SettingsTab trip={trip} update={update} set={set} onPublish={handlePublish} onPreview={() => onPreview(trip.id)} onToast={showToast} />
        )}
      </div>
    </div>
  );
}
