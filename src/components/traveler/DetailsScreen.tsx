import { useState } from "react";
import type { Trip } from "../../types";
import { collectCurrencies, rateLine, toHome } from "../../lib/currency";
import { todayISO, type TimeFormat } from "../../lib/date";
import { localizeStay } from "../../lib/localize";
import { ui, CONTACT_COLOR } from "../../lib/ui";
import { cn } from "../../lib/cn";

interface DetailsScreenProps {
  trip: Trip;
  prefLang: string;
  setPrefLang: (code: string) => void;
  timeFormat: TimeFormat;
  setTimeFormat: (fmt: TimeFormat) => void;
}

const TIME_OPTIONS: { value: TimeFormat; label: string }[] = [
  { value: "24h", label: "24-hour" },
  { value: "12h", label: "12-hour" },
];

const PRESETS = [1000, 3000, 5000, 10000];

const Pill = ({
  on,
  label,
  onClick,
}: {
  on: boolean;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex-1 cursor-pointer rounded-[12px] px-0 py-[11px] text-center text-[14.5px] font-bold",
      on ? "bg-accent text-white" : "bg-control text-ink-dim",
    )}
  >
    {label}
  </button>
);

const Label = ({ children }: { children: string }) => (
  <div className="mb-[10px] text-[12px] font-extrabold uppercase tracking-[0.6px] text-faint">
    {children}
  </div>
);

export function DetailsScreen({
  trip,
  prefLang,
  setPrefLang,
  timeFormat,
  setTimeFormat,
}: DetailsScreenProps) {
  const [conv, setConv] = useState(5000);
  const [curSel, setCurSel] = useState<string | null>(null);

  const currencies = collectCurrencies(trip);
  const todayIdx = trip.days.findIndex((d) => d.date === todayISO());
  const todayCur =
    (todayIdx >= 0 ? trip.days[todayIdx].currency : undefined) ?? trip.currency;
  const cur =
    currencies.find((c) => c.code === (curSel ?? todayCur.code)) ?? todayCur;
  const multiCur = currencies.length > 1;

  const languages = trip.languages ?? [];
  const langOptions = [{ code: "en", label: "English" }, ...languages];

  return (
    <>
      <div className="shrink-0 px-[18px] pt-[54px] pb-[12px]">
        <div className="text-[27px] font-extrabold tracking-[-0.5px]">
          Trip details
        </div>
        <div className="mt-[3px] text-[15px] font-medium text-muted">
          Money, contacts & helpful info
        </div>
      </div>
      <div className="no-scrollbar flex-1 min-h-0 overflow-x-hidden overflow-y-auto px-[18px] pt-1 pb-[26px]">
        {/* Language */}
        {languages.length > 0 && (
          <div className={cn(ui.padCard, "mb-4")}>
            <Label>Language</Label>
            <div className="flex gap-[7px]">
              {langOptions.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setPrefLang(l.code)}
                  className={cn(
                    "flex-1 cursor-pointer rounded-[12px] px-0 py-3 text-center text-[15px] font-bold",
                    prefLang === l.code
                      ? "bg-accent text-white"
                      : "bg-control text-ink-dim",
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <div className="mt-[10px] text-[13px] font-semibold leading-[1.4] text-faint">
              Attractions & hotels show in your language where available.
            </div>
          </div>
        )}

        {/* Time format */}
        <div className={cn(ui.padCard, "mb-4")}>
          <Label>Time format</Label>
          <div className="flex gap-[7px]">
            {TIME_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setTimeFormat(o.value)}
                className={cn(
                  "flex-1 cursor-pointer rounded-[12px] px-0 py-3 text-center text-[15px] font-bold",
                  timeFormat === o.value
                    ? "bg-accent text-white"
                    : "bg-control text-ink-dim",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="mt-[10px] text-[13px] font-semibold leading-[1.4] text-faint">
            {timeFormat === "12h"
              ? "Activity times show as 2:05 PM."
              : "Activity times show as 14:05."}
          </div>
        </div>

        {/* Money */}
        <div className={cn(ui.padCard, "mb-4")}>
          <div className="mb-[10px] flex items-center justify-between">
            <div className="text-[12px] font-extrabold uppercase tracking-[0.6px] text-faint">
              Money
            </div>
            {multiCur && (
              <div className="flex gap-[5px]">
                {currencies.map((cc) => (
                  <button
                    key={cc.code}
                    onClick={() => setCurSel(cc.code)}
                    className={cn(
                      "cursor-pointer rounded-pill px-[12px] py-[5px] text-[12.5px] font-extrabold",
                      cc.code === cur.code
                        ? "bg-accent text-white"
                        : "bg-control text-ink-dim",
                    )}
                  >
                    {cc.code}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="my-1 flex items-baseline gap-[10px]">
            <div className="text-[30px] font-extrabold tracking-[-0.5px]">
              {cur.symbol}
              {conv.toLocaleString()}
            </div>
            <div className="text-[18px] font-bold text-muted">
              ≈ {cur.homeSymbol}
              {toHome(conv, cur)}
            </div>
          </div>
          <div className="mb-3 text-[13.5px] font-semibold text-faint">
            {rateLine(cur)}
          </div>
          <div className="mb-[6px] text-[12.5px] font-bold text-ink-dim">
            Enter an amount ({cur.code})
          </div>
          <input
            value={String(conv)}
            inputMode="numeric"
            onChange={(e) => {
              const n = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
              setConv(Number.isNaN(n) ? 0 : n);
            }}
            className={cn(ui.input, "mb-3 h-[50px] font-bold")}
          />
          <div className="flex gap-[7px]">
            {PRESETS.map((v) => (
              <Pill
                key={v}
                on={v === conv}
                label={`${cur.symbol}${v.toLocaleString()}`}
                onClick={() => setConv(v)}
              />
            ))}
          </div>
        </div>

        {/* Contacts */}
        {trip.contacts.length > 0 && (
          <div className={cn(ui.padCard, "mb-4")}>
            <Label>Important contacts</Label>
            {trip.contacts.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-[13px] px-0 py-[9px]"
              >
                <div
                  className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[12px] text-[18px] font-extrabold text-white"
                  style={{ background: CONTACT_COLOR[c.kind] ?? "#8A8175" }}
                >
                  {c.label[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[16px] font-bold">{c.label}</div>
                  <div className="text-[14px] font-semibold text-muted">
                    {c.value}
                  </div>
                </div>
                <a
                  href={`tel:${c.value.replace(/[^0-9+]/g, "")}`}
                  className="rounded-[12px] bg-control px-4 py-[9px] text-[14px] font-extrabold text-accent no-underline"
                >
                  Call
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Hotel */}
        {trip.hotel?.name && (
          <div className={cn(ui.padCard, "mb-4")}>
            <Label>Your hotel</Label>
            {(() => {
              const hotel = localizeStay(trip.hotel, prefLang);
              return (
                <>
                  <div className="text-[18px] font-bold">{hotel.name}</div>
                  {hotel.address && (
                    <div className="mt-1 text-[14.5px] font-medium leading-[1.4] text-muted">
                      {hotel.address}
                    </div>
                  )}
                  {hotel.phone && (
                    <a
                      href={`tel:${hotel.phone.replace(/[^0-9+]/g, "")}`}
                      className="mt-3 inline-block rounded-[13px] bg-accent px-5 py-[11px] text-[15px] font-extrabold text-white no-underline"
                    >
                      Call the hotel
                    </a>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Phrases */}
        {trip.phrases.length > 0 && (
          <div className={ui.padCard}>
            <Label>Useful phrases</Label>
            {trip.phrases.map((ph, i) => (
              <div
                key={i}
                className={cn(
                  "px-0 py-2",
                  i === trip.phrases.length - 1
                    ? "border-b-0"
                    : "border-b border-control",
                )}
              >
                <div className="text-[15px] font-semibold text-muted">
                  {ph.en}
                </div>
                <div className="mt-px text-[18px] font-bold">{ph.local}</div>
                <div className="text-[13.5px] font-semibold italic text-fainter">
                  {ph.pron}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
