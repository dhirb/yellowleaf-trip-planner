import { useState } from "react";
import type { Trip } from "../../types";
import { collectCurrencies, rateLine, toHome } from "../../lib/currency";
import { todayISO } from "../../lib/date";
import { ui, CONTACT_COLOR } from "../../lib/ui";

interface DetailsScreenProps {
  trip: Trip;
  prefLang: string;
  setPrefLang: (code: string) => void;
}

const PRESETS = [1000, 3000, 5000, 10000];

const Pill = ({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1,
      padding: "11px 0",
      borderRadius: 12,
      textAlign: "center",
      fontSize: 14.5,
      fontWeight: 700,
      cursor: "pointer",
      border: "none",
      fontFamily: "inherit",
      background: on ? "#C2541F" : "#F3ECE1",
      color: on ? "#fff" : "#6B635A",
    }}
  >
    {label}
  </button>
);

const Label = ({ children }: { children: string }) => (
  <div style={{ fontSize: 12, fontWeight: 800, color: "#A89F92", letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 10 }}>
    {children}
  </div>
);

export function DetailsScreen({ trip, prefLang, setPrefLang }: DetailsScreenProps) {
  const [conv, setConv] = useState(5000);
  const [curSel, setCurSel] = useState<string | null>(null);

  const currencies = collectCurrencies(trip);
  const todayIdx = trip.days.findIndex((d) => d.date === todayISO());
  const todayCur = (todayIdx >= 0 ? trip.days[todayIdx].currency : undefined) ?? trip.currency;
  const cur = currencies.find((c) => c.code === (curSel ?? todayCur.code)) ?? todayCur;
  const multiCur = currencies.length > 1;

  const nl = trip.nativeLang;
  const langOptions = [{ code: "en", label: "English" }, ...(nl ? [{ code: nl.code, label: nl.label }] : [])];

  return (
    <>
      <div style={{ padding: "54px 18px 12px", flexShrink: 0 }}>
        <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-0.5px" }}>Trip details</div>
        <div style={{ fontSize: 15, color: "#8A8175", fontWeight: 500, marginTop: 3 }}>Money, contacts & helpful info</div>
      </div>
      <div className="no-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", padding: "4px 18px 26px" }}>
        {/* Language */}
        {nl && (
          <div style={{ ...ui.padCard, marginBottom: 16 }}>
            <Label>Language</Label>
            <div style={{ display: "flex", gap: 7 }}>
              {langOptions.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setPrefLang(l.code)}
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    borderRadius: 12,
                    textAlign: "center",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "none",
                    fontFamily: "inherit",
                    background: prefLang === l.code ? "#C2541F" : "#F3ECE1",
                    color: prefLang === l.code ? "#fff" : "#6B635A",
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 13, color: "#A89F92", fontWeight: 600, marginTop: 10, lineHeight: 1.4 }}>
              Attractions & hotels show in your language where available.
            </div>
          </div>
        )}

        {/* Money */}
        <div style={{ ...ui.padCard, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#A89F92", letterSpacing: "0.6px", textTransform: "uppercase" }}>Money</div>
            {multiCur && (
              <div style={{ display: "flex", gap: 5 }}>
                {currencies.map((cc) => (
                  <button
                    key={cc.code}
                    onClick={() => setCurSel(cc.code)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 999,
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: "pointer",
                      border: "none",
                      fontFamily: "inherit",
                      background: cc.code === cur.code ? "#C2541F" : "#F3ECE1",
                      color: cc.code === cur.code ? "#fff" : "#6B635A",
                    }}
                  >
                    {cc.code}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, margin: "4px 0" }}>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.5px" }}>
              {cur.symbol}
              {conv.toLocaleString()}
            </div>
            <div style={{ fontSize: 18, color: "#8A8175", fontWeight: 700 }}>
              ≈ {cur.homeSymbol}
              {toHome(conv, cur)}
            </div>
          </div>
          <div style={{ fontSize: 13.5, color: "#A89F92", fontWeight: 600, marginBottom: 12 }}>{rateLine(cur)}</div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#6B635A", marginBottom: 6 }}>Enter an amount ({cur.code})</div>
          <input
            value={String(conv)}
            inputMode="numeric"
            onChange={(e) => {
              const n = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
              setConv(Number.isNaN(n) ? 0 : n);
            }}
            style={{ ...ui.input, height: 50, fontWeight: 700, marginBottom: 12 }}
          />
          <div style={{ display: "flex", gap: 7 }}>
            {PRESETS.map((v) => (
              <Pill key={v} on={v === conv} label={`${cur.symbol}${v.toLocaleString()}`} onClick={() => setConv(v)} />
            ))}
          </div>
        </div>

        {/* Contacts */}
        {trip.contacts.length > 0 && (
          <div style={{ ...ui.padCard, marginBottom: 16 }}>
            <Label>Important contacts</Label>
            {trip.contacts.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: "9px 0" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#fff",
                    background: CONTACT_COLOR[c.kind] ?? "#8A8175",
                  }}
                >
                  {c.label[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{c.label}</div>
                  <div style={{ fontSize: 14, color: "#8A8175", fontWeight: 600 }}>{c.value}</div>
                </div>
                <a
                  href={`tel:${c.value.replace(/[^0-9+]/g, "")}`}
                  style={{ textDecoration: "none", background: "#F3ECE1", color: "#C2541F", fontWeight: 800, fontSize: 14, padding: "9px 16px", borderRadius: 12 }}
                >
                  Call
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Hotel */}
        {trip.hotel?.name && (
          <div style={{ ...ui.padCard, marginBottom: 16 }}>
            <Label>Your hotel</Label>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{trip.hotel.name}</div>
            {trip.hotel.address && (
              <div style={{ fontSize: 14.5, color: "#8A8175", fontWeight: 500, marginTop: 4, lineHeight: 1.4 }}>{trip.hotel.address}</div>
            )}
            {trip.hotel.phone && (
              <a
                href={`tel:${trip.hotel.phone.replace(/[^0-9+]/g, "")}`}
                style={{ display: "inline-block", marginTop: 12, textDecoration: "none", background: "#C2541F", color: "#fff", fontWeight: 800, fontSize: 15, padding: "11px 20px", borderRadius: 13 }}
              >
                Call the hotel
              </a>
            )}
          </div>
        )}

        {/* Phrases */}
        {trip.phrases.length > 0 && (
          <div style={ui.padCard}>
            <Label>Useful phrases</Label>
            {trip.phrases.map((ph, i) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: i === trip.phrases.length - 1 ? "none" : "1px solid #F3ECE1" }}>
                <div style={{ fontSize: 15, color: "#8A8175", fontWeight: 600 }}>{ph.en}</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 1 }}>{ph.local}</div>
                <div style={{ fontSize: 13.5, color: "#B0A693", fontWeight: 600, fontStyle: "italic" }}>{ph.pron}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
