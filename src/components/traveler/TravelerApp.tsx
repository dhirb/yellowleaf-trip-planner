import { useEffect, useState } from "react";
import type { LayoutMode, Trip } from "../../types";
import { todayISO } from "../../lib/date";
import { buildViewItems } from "../../lib/dayView";
import { LockScreen } from "./LockScreen";
import { DayScreen } from "./DayScreen";
import { CalendarScreen } from "./CalendarScreen";
import { DetailsScreen } from "./DetailsScreen";
import { DetailSheet } from "./DetailSheet";
import { TabBar, type TravelerScreen } from "./TabBar";

/** The full traveler experience for a single trip. */
export function TravelerApp({ trip }: { trip: Trip }) {
  const [tDay, setTDay] = useState(0);
  const [screen, setScreen] = useState<TravelerScreen>("day");
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [prefLang, setPrefLang] = useState("en");
  const [layout, setLayout] = useState<LayoutMode>("cards");

  const today = todayISO();

  // Land on today's day if the trip covers it, else the first day.
  useEffect(() => {
    const idx = trip.days.findIndex((d) => d.date === today);
    setTDay(idx >= 0 ? idx : 0);
    setOpenIdx(null);
  }, [trip.id, trip.days, today]);

  const showLock = trip.visibility === "private" && !unlocked;
  if (showLock) {
    return (
      <LockScreen
        title={trip.title}
        onUnlock={(code) => {
          const ok = code.trim().toLowerCase() === (trip.password ?? "").trim().toLowerCase();
          if (ok) setUnlocked(true);
          return ok;
        }}
      />
    );
  }

  const nl = trip.nativeLang;
  const useLocalLang = !!(nl && prefLang === nl.code);
  const dayCount = trip.days.length;
  const safeDay = Math.max(0, Math.min(tDay, dayCount - 1));

  const goDay = (i: number) => {
    setTDay(Math.max(0, Math.min(dayCount - 1, i)));
    setOpenIdx(null);
  };
  const openDay = (i: number) => {
    goDay(i);
    setScreen("day");
  };

  const currentDay = trip.days[safeDay] ?? trip.days[0];
  const sheetItems = buildViewItems(currentDay, useLocalLang);
  const sheetView = openIdx != null ? sheetItems[openIdx] : null;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative", background: "#FBF8F3" }}>
      {screen === "day" && (
        <DayScreen
          trip={trip}
          dayIndex={safeDay}
          today={today}
          useLocalLang={useLocalLang}
          layout={layout}
          setLayout={setLayout}
          onSelectDay={goDay}
          onPrevDay={() => goDay(safeDay - 1)}
          onNextDay={() => goDay(safeDay + 1)}
          onOpenItem={(index) => setOpenIdx(index)}
        />
      )}
      {screen === "calendar" && <CalendarScreen trip={trip} dayIndex={safeDay} today={today} onOpenDay={openDay} />}
      {screen === "info" && <DetailsScreen trip={trip} prefLang={prefLang} setPrefLang={setPrefLang} />}

      <TabBar active={screen} onChange={(s) => setScreen(s)} />

      {sheetView && <DetailSheet view={sheetView} onClose={() => setOpenIdx(null)} />}
    </div>
  );
}
