import type { LayoutMode } from "../../types";
import type { ViewItem } from "../../lib/dayView";
import { Chevron } from "../../lib/icons";

interface DayItemsProps {
  items: ViewItem[];
  layout: LayoutMode;
  onOpen: (index: number) => void;
}

const Thumb = ({ url, size = 46, radius = 14 }: { url: string; size?: number; radius?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: radius,
      background: `center/cover url("${url}")`,
      flexShrink: 0,
      boxShadow: "0 5px 12px rgba(0,0,0,0.14)",
    }}
  />
);

/** Renders a day's activities in the chosen layout: timeline, cards, or simple list. */
export function DayItems({ items, layout, onOpen }: DayItemsProps) {
  if (items.length === 0) {
    return (
      <div style={{ padding: "26px 4px", color: "#A89F92", fontSize: 15, fontWeight: 600, textAlign: "center" }}>
        Nothing planned for this day yet.
      </div>
    );
  }

  if (layout === "timeline") {
    return (
      <>
        {items.map((vi) => (
          <button
            key={vi.index}
            onClick={() => onOpen(vi.index)}
            style={{
              display: "flex",
              gap: 14,
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
              background: "none",
              border: "none",
              padding: 0,
              fontFamily: "inherit",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <Thumb url={vi.thumb} />
              <div
                style={{
                  flex: 1,
                  width: 2,
                  background: vi.isLast ? "transparent" : "#EBE3D6",
                  margin: "5px 0",
                  borderRadius: 2,
                  minHeight: 14,
                }}
              />
            </div>
            <div style={{ flex: 1, paddingBottom: 18, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#A89F92" }}>{vi.item.time}</div>
              <div style={{ fontSize: 19, fontWeight: 700, margin: "2px 0", letterSpacing: "-0.2px", textWrap: "pretty" }}>
                {vi.title}
              </div>
              <div style={{ fontSize: 15, color: "#8A8175", fontWeight: 500 }}>{vi.place}</div>
              {vi.tag && (
                <span
                  style={{
                    display: "inline-block",
                    color: vi.accent,
                    background: vi.soft,
                    padding: "4px 11px",
                    borderRadius: 999,
                    fontSize: 12.5,
                    fontWeight: 700,
                    marginTop: 8,
                  }}
                >
                  {vi.tag}
                </span>
              )}
            </div>
            <div style={{ flexShrink: 0, marginTop: 14 }}>
              <Chevron dir="right" size={14} />
            </div>
          </button>
        ))}
      </>
    );
  }

  if (layout === "list") {
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          border: "1px solid #EFE8DD",
          boxShadow: "0 4px 14px rgba(80,55,25,0.05)",
          overflow: "hidden",
        }}
      >
        {items.map((vi) => (
          <button
            key={vi.index}
            onClick={() => onOpen(vi.index)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 13,
              padding: "14px 15px",
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
              background: "none",
              border: "none",
              borderBottom: vi.isLast ? "none" : "1px solid #F1EBE0",
              fontFamily: "inherit",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: "#A89F92", width: 46, flexShrink: 0 }}>{vi.item.time}</div>
            <Thumb url={vi.thumb} size={38} radius={10} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: "-0.1px" }}>{vi.title}</div>
            </div>
            <Chevron dir="right" size={14} />
          </button>
        ))}
      </div>
    );
  }

  // cards (default)
  return (
    <>
      {items.map((vi) => (
        <button
          key={vi.index}
          onClick={() => onOpen(vi.index)}
          style={{
            background: "#fff",
            borderRadius: 18,
            border: "1px solid #EFE8DD",
            boxShadow: "0 4px 14px rgba(80,55,25,0.05)",
            padding: 15,
            display: "flex",
            gap: 14,
            alignItems: "center",
            cursor: "pointer",
            marginBottom: 12,
            width: "100%",
            textAlign: "left",
            fontFamily: "inherit",
          }}
        >
          <Thumb url={vi.thumb} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#A89F92" }}>{vi.item.time}</div>
            <div style={{ fontSize: 18, fontWeight: 700, margin: "1px 0", letterSpacing: "-0.2px", textWrap: "pretty" }}>
              {vi.title}
            </div>
            <div style={{ fontSize: 14.5, color: "#8A8175", fontWeight: 500 }}>{vi.place}</div>
          </div>
          <Chevron dir="right" size={14} />
        </button>
      ))}
    </>
  );
}
