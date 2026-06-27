import type { Trip } from "../../types";
import { bigDate, formatTime, type TimeFormat } from "../../lib/date";
import { buildViewItems } from "../../lib/dayView";
import { localizeStay, localizeDayTheme } from "../../lib/localize";
import { ui } from "../../lib/ui";
import { cn } from "../../lib/cn";
import { BedDouble, ChevronLeft, ChevronRight, Plane, Sun } from "lucide-react";
import { useSwipe } from "../../hooks/useSwipe";
import { DayStrip } from "./DayStrip";
import { DayItems } from "./DayItems";

interface DayScreenProps {
  trip: Trip;
  dayIndex: number;
  today: string;
  lang: string;
  timeFormat: TimeFormat;
  onSelectDay: (i: number) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onOpenItem: (index: number) => void;
}

const SunIcon = () => <Sun size={16} color="#E08A1E" strokeWidth={2} />;

const NavBtn = ({
  dir,
  onClick,
}: {
  dir: "left" | "right";
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={ui.chevBtn}
    aria-label={dir === "left" ? "Previous day" : "Next day"}
  >
    {dir === "left" ? (
      <ChevronLeft size={22} color="#7A6F60" strokeWidth={2.6} />
    ) : (
      <ChevronRight size={22} color="#7A6F60" strokeWidth={2.6} />
    )}
  </button>
);

export function DayScreen({
  trip,
  dayIndex,
  today,
  lang,
  timeFormat,
  onSelectDay,
  onPrevDay,
  onNextDay,
  onOpenItem,
}: DayScreenProps) {
  const day = trip.days[dayIndex] ?? trip.days[0];
  const viewItems = buildViewItems(day, lang);
  const swipe = useSwipe(onPrevDay, onNextDay);

  const rawStay = day.stay ?? trip.hotel;
  const stay = rawStay ? localizeStay(rawStay, lang) : null;
  const stayName = stay?.name ?? "";
  const staySub = stay?.desc ?? stay?.note ?? "";

  return (
    <>
      <div className={ui.header}>
        <div className="mb-4 flex items-start justify-between">
          <div className="min-w-0">
            <div className="text-[12px] font-extrabold uppercase tracking-[0.8px] text-accent">
              {trip.dest}, {trip.country}
            </div>
            <div className="mt-[3px] overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-semibold text-muted">
              {trip.title}
            </div>
          </div>
          {day.weather && (
            <div className="flex shrink-0 items-center gap-[6px] rounded-pill bg-accent-amber px-[12px] py-[7px] text-[14px] font-extrabold text-[#b5701a]">
              <SunIcon />
              {day.weather}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <NavBtn dir="left" onClick={onPrevDay} />
          <div className="min-w-0 flex-1 text-center">
            <div className="text-[27px] font-extrabold tracking-[-0.6px]">
              {bigDate(day.date)}
            </div>
            <div className="mt-[2px] text-[14.5px] font-semibold text-muted">
              Day {dayIndex + 1} of {trip.days.length} · {localizeDayTheme(day, lang)}
            </div>
          </div>
          <NavBtn dir="right" onClick={onNextDay} />
        </div>

        <div className="mx-[-2px] mt-4">
          <DayStrip
            days={trip.days}
            current={dayIndex}
            today={today}
            onSelect={onSelectDay}
          />
        </div>
      </div>

      <div
        className={cn("no-scrollbar", ui.body)}
        onPointerDown={swipe.onPointerDown}
        onPointerMove={swipe.onPointerMove}
        onPointerUp={swipe.onPointerUp}
        onPointerLeave={swipe.onPointerUp}
      >
        <div
          style={{
            transform: `translateX(${swipe.dragX}px)`,
            transition: swipe.dragging
              ? "none"
              : "transform .28s cubic-bezier(.22,.61,.36,1)",
          }}
        >
          <div className="px-[18px] pt-2 pb-[26px]">
            {/* Flights */}
            {(day.flights ?? []).map((f, i) => (
              <div
                key={i}
                className="mb-[14px] flex items-center gap-[14px] rounded-lg border border-[#d2e3f0] bg-[#eaf2f9] p-[15px]"
              >
                <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-md bg-flight shadow-[0_5px_12px_rgba(30,111,168,0.28)]">
                  <Plane size={22} color="#fff" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-extrabold uppercase tracking-[0.4px] text-[#2c6e9b]">
                    Flight · {f.flightNo}
                  </div>
                  <div className="my-[2px] text-[18.5px] font-extrabold tracking-[-0.2px]">
                    {f.kind === "departure" ? "Departs " : "Arrives "}
                    {formatTime(f.time, timeFormat)}
                  </div>
                  <div className="text-[14.5px] font-semibold text-[#5c7c92]">
                    {f.from} &nbsp;→&nbsp; {f.to}
                  </div>
                </div>
              </div>
            ))}

            <DayItems
              items={viewItems}
              timeFormat={timeFormat}
              onOpen={onOpenItem}
            />

            {/* Accommodation */}
            {stayName && (
              <div
                className={cn(
                  ui.padCard,
                  "mt-[18px] flex items-center gap-[14px]",
                )}
              >
                <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-md bg-stay">
                  <BedDouble size={22} color="#fff" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-extrabold uppercase tracking-[0.6px] text-faint">
                    Where you're staying
                  </div>
                  <div className="mt-[2px] text-[17px] font-bold">
                    {stayName}
                  </div>
                  <div className="mt-px text-[14px] font-medium text-muted">
                    {staySub}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
