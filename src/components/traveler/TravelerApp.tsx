import { useEffect, useState } from "react";
import type { Trip } from "../../types";
import { todayISO } from "../../lib/date";
import { buildViewItems } from "../../lib/dayView";
import { LockScreen } from "./LockScreen";
import { DayScreen } from "./DayScreen";
import { CalendarScreen } from "./CalendarScreen";
import { DetailsScreen } from "./DetailsScreen";
import { DetailSheet } from "./DetailSheet";
import { TabBar, type TravelerScreen } from "./TabBar";
import { useTimeFormat } from "../../hooks/useTimeFormat";

/** The full traveler experience for a single trip. */
export function TravelerApp({ trip }: { trip: Trip }) {
  const [tDay, setTDay] = useState(0);
  const [screen, setScreen] = useState<TravelerScreen>("day");
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [prefLang, setPrefLang] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(`yl.lang.${trip.id}`);
      if (stored === "en" || (trip.languages ?? []).some((l) => l.code === stored)) {
        return stored as string;
      }
    } catch {
      /* ignore storage errors */
    }
    return "en";
  });

  const changeLang = (code: string) => {
    setPrefLang(code);
    try {
      localStorage.setItem(`yl.lang.${trip.id}`, code);
    } catch {
      /* ignore storage errors */
    }
  };
  const { timeFormat, setTimeFormat } = useTimeFormat();

  const today = todayISO();

  // Land on today's day if the trip covers it, else the first day.
  useEffect(() => {
    const idx = trip.days.findIndex((d) => d.date === today);
    setTDay(idx >= 0 ? idx : 0);
    setOpenIdx(null);
  }, [trip.id, trip.days, today]);

  // Reset to English if the chosen language is no longer in the trip.
  useEffect(() => {
    if (prefLang !== "en" && !(trip.languages ?? []).some((l) => l.code === prefLang)) {
      setPrefLang("en");
    }
  }, [trip.languages, prefLang]);

  const showLock = trip.visibility === "private" && !unlocked;
  if (showLock) {
    return (
      <LockScreen
        title={trip.title}
        onUnlock={(code) => {
          const ok =
            code.trim().toLowerCase() ===
            (trip.password ?? "").trim().toLowerCase();
          if (ok) setUnlocked(true);
          return ok;
        }}
      />
    );
  }

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
  const sheetItems = buildViewItems(currentDay, prefLang);
  const sheetView = openIdx != null ? sheetItems[openIdx] : null;

  return (
    <div className="relative flex h-full flex-col bg-app-bg">
      {screen === "day" && (
        <DayScreen
          trip={trip}
          dayIndex={safeDay}
          today={today}
          lang={prefLang}
          timeFormat={timeFormat}
          onSelectDay={goDay}
          onPrevDay={() => goDay(safeDay - 1)}
          onNextDay={() => goDay(safeDay + 1)}
          onOpenItem={(index) => setOpenIdx(index)}
        />
      )}
      {screen === "calendar" && (
        <CalendarScreen
          trip={trip}
          dayIndex={safeDay}
          today={today}
          onOpenDay={openDay}
        />
      )}
      {screen === "info" && (
        <DetailsScreen
          trip={trip}
          prefLang={prefLang}
          setPrefLang={changeLang}
          timeFormat={timeFormat}
          setTimeFormat={setTimeFormat}
        />
      )}

      <TabBar active={screen} onChange={(s) => setScreen(s)} />

      {sheetView && (
        <DetailSheet
          view={sheetView}
          timeFormat={timeFormat}
          onClose={() => setOpenIdx(null)}
        />
      )}
    </div>
  );
}
