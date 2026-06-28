import { useEffect, useState } from "react";
import type { Trip } from "../../types";
import { todayISO } from "../../lib/date";
import { buildViewItems } from "../../lib/dayView";
import { localizeStay } from "../../lib/localize";
import { DayScreen } from "./DayScreen";
import { HelpScreen } from "./HelpScreen";
import { SettingsScreen } from "./SettingsScreen";
import { DetailScreen } from "./DetailScreen";
import { FlightDetailScreen } from "./FlightDetailScreen";
import { StayDetailScreen } from "./StayDetailScreen";
import { TabBar, type TravelerScreen } from "./TabBar";
import { useTimeFormat } from "../../hooks/useTimeFormat";
import { useFontScale } from "../../hooks/useFontScale";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useTripManifest } from "../../hooks/useTripManifest";

/** Which card, if any, has been tapped open into its full-page detail view. */
type OpenTarget =
  | { kind: "item"; index: number }
  | { kind: "flight"; index: number }
  | { kind: "stay" };

/** The full traveler experience for a single trip. */
export function TravelerApp({ trip }: { trip: Trip }) {
  const [tDay, setTDay] = useState(0);
  const [screen, setScreen] = useState<TravelerScreen>("day");
  const [open, setOpen] = useState<OpenTarget | null>(null);
  // Per-trip language choice, validated against the trip's available languages
  // (English is always the implicit base).
  const [prefLang, changeLang] = useLocalStorage<string>(
    `yl.lang.${trip.id}`,
    "en",
    (raw) =>
      raw === "en" || (trip.languages ?? []).some((l) => l.code === raw)
        ? raw
        : null,
  );
  const { timeFormat, setTimeFormat } = useTimeFormat();
  const { fontScale, setFontScale } = useFontScale();

  // Name the installable PWA after this trip (and open it straight to the
  // trip), restoring the static manifest when the traveller leaves.
  useTripManifest(trip.id, trip.title);

  const today = todayISO();

  // Land on today's day if the trip covers it, else the first day.
  useEffect(() => {
    const idx = trip.days.findIndex((d) => d.date === today);
    setTDay(idx >= 0 ? idx : 0);
    setOpen(null);
  }, [trip.id, trip.days, today]);

  // Reset to English if the chosen language is no longer in the trip.
  useEffect(() => {
    if (
      prefLang !== "en" &&
      !(trip.languages ?? []).some((l) => l.code === prefLang)
    ) {
      changeLang("en");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.languages, prefLang]);

  const dayCount = trip.days.length;
  const safeDay = Math.max(0, Math.min(tDay, dayCount - 1));

  const goDay = (i: number) => {
    setTDay(Math.max(0, Math.min(dayCount - 1, i)));
    setOpen(null);
  };

  const currentDay = trip.days[safeDay] ?? trip.days[0];
  const back = () => setOpen(null);

  // An open card replaces the whole traveler chrome with a full page (mirroring
  // the admin editor), so the tab bar steps out of the way.
  if (open?.kind === "item") {
    const view = buildViewItems(currentDay, prefLang)[open.index];
    if (view) {
      return <DetailScreen view={view} timeFormat={timeFormat} onBack={back} />;
    }
  }
  if (open?.kind === "flight") {
    const flight = (currentDay.flights ?? [])[open.index];
    if (flight) {
      return (
        <FlightDetailScreen
          flight={flight}
          timeFormat={timeFormat}
          onBack={back}
        />
      );
    }
  }
  if (open?.kind === "stay") {
    const rawStay = currentDay.stay ?? trip.hotel;
    const stay = rawStay ? localizeStay(rawStay, prefLang) : null;
    if (stay) {
      return <StayDetailScreen stay={stay} onBack={back} />;
    }
  }

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
          onOpenItem={(index) => setOpen({ kind: "item", index })}
          onOpenFlight={(index) => setOpen({ kind: "flight", index })}
          onOpenStay={() => setOpen({ kind: "stay" })}
        />
      )}
      {screen === "help" && <HelpScreen trip={trip} />}
      {screen === "settings" && (
        <SettingsScreen
          trip={trip}
          prefLang={prefLang}
          setPrefLang={changeLang}
          timeFormat={timeFormat}
          setTimeFormat={setTimeFormat}
          fontScale={fontScale}
          setFontScale={setFontScale}
        />
      )}

      <TabBar active={screen} onChange={(s) => setScreen(s)} />
    </div>
  );
}
