import { useState } from "react";
import type { Trip } from "../../types";
import { collectCurrencies, rateLine, toHome } from "../../lib/currency";
import { todayISO, type TimeFormat } from "../../lib/date";
import {
  FONT_STEPS,
  FONT_STEP_LABELS,
  type FontStep,
} from "../../lib/fontScale";
import { ui } from "../../lib/ui";
import { cn } from "../../lib/cn";
import { InstallCard } from "./InstallPrompt";

interface SettingsScreenProps {
  trip: Trip;
  prefLang: string;
  setPrefLang: (code: string) => void;
  timeFormat: TimeFormat;
  setTimeFormat: (fmt: TimeFormat) => void;
  fontScale: FontStep;
  setFontScale: (step: FontStep) => void;
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

export function SettingsScreen({
  trip,
  prefLang,
  setPrefLang,
  timeFormat,
  setTimeFormat,
  fontScale,
  setFontScale,
}: SettingsScreenProps) {
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
      <div className="shrink-0 px-[18px] pt-[max(env(safe-area-inset-top),14px)] pb-[12px]">
        <div className="text-[27px] font-extrabold tracking-[-0.5px]">
          Settings
        </div>
      </div>
      <div className="no-scrollbar flex-1 min-h-0 overflow-x-hidden overflow-y-auto px-[18px] pt-1 pb-[26px]">
        {/* Install (hidden once installed / on unsupported browsers) */}
        <InstallCard />

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

        {/* Text size */}
        <div className={cn(ui.padCard, "mb-4")}>
          <Label>Text size</Label>
          <div className="flex gap-[7px]">
            {FONT_STEPS.map((step) => (
              <button
                key={step}
                onClick={() => setFontScale(step)}
                className={cn(
                  "flex-1 cursor-pointer rounded-[12px] px-0 py-3 text-center text-body font-bold",
                  fontScale === step
                    ? "bg-accent text-white"
                    : "bg-control text-ink-dim",
                )}
              >
                {FONT_STEP_LABELS[step]}
              </button>
            ))}
          </div>
          <div className="mt-[10px] text-caption font-semibold leading-[1.4] text-faint">
            Makes all text larger for easier reading.
          </div>
        </div>

        {/* Money */}
        <div className={ui.padCard}>
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
      </div>
    </>
  );
}
