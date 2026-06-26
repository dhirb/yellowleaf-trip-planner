import type { ViewItem } from "../../lib/dayView";
import { imgFor } from "../../lib/dayView";
import { ui } from "../../lib/ui";

/** Slide-up sheet showing an activity's full details. */
export function DetailSheet({ view, onClose }: { view: ViewItem; onClose: () => void }) {
  const { item } = view;
  const banner = imgFor(item, 480, 320);

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(31,27,22,0.4)", zIndex: 80, animation: "fadeIn .2s ease" }}
      />
      <div
        className="no-scrollbar"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 81,
          background: "#FBF8F3",
          borderRadius: "28px 28px 0 0",
          padding: "12px 22px 40px",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.2)",
          animation: "sheetUp .3s cubic-bezier(.22,.61,.36,1)",
          maxHeight: "78%",
          overflowY: "auto",
        }}
      >
        <div style={{ width: 44, height: 5, borderRadius: 99, background: "#DDD3C2", margin: "4px auto 18px" }} />
        <div
          style={{
            height: 168,
            borderRadius: 18,
            background: `center/cover url("${banner}")`,
            marginBottom: 16,
            boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
          }}
        />
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.4px", margin: "2px 0 6px", textWrap: "pretty" }}>
          {view.title}
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#A89F92", marginBottom: 6 }}>{item.time}</div>
        {view.place && <div style={{ fontSize: 16, color: "#8A8175", fontWeight: 600 }}>{view.place}</div>}
        {item.note && (
          <div style={{ fontSize: 17, lineHeight: 1.5, color: "#443E36", fontWeight: 500, marginTop: 16, textWrap: "pretty" }}>
            {item.note}
          </div>
        )}
        {item.cost && (
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <div style={{ flex: 1, background: "#fff", border: "1px solid #EFE8DD", borderRadius: 14, padding: "12px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#A89F92", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Cost
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>{item.cost}</div>
            </div>
          </div>
        )}
        {item.tip && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#FBEFE0", borderRadius: 14, padding: "14px 16px", marginTop: 12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" stroke="#B5701A" strokeWidth="2" strokeLinejoin="round" />
              <path d="M9 20h6M10 17v3M14 17v3" stroke="#B5701A" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div style={{ fontSize: 15, color: "#8A5A14", fontWeight: 600, lineHeight: 1.4 }}>{item.tip}</div>
          </div>
        )}
        <button onClick={onClose} style={{ ...ui.btnGhost, marginTop: 20 }}>
          Close
        </button>
      </div>
    </>
  );
}
