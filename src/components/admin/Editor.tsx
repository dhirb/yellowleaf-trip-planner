import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useTripEditor } from "../../hooks/useTripEditor";
import {
  generateActivityDescription,
  generateActivityImage,
  translateItem,
} from "../../lib/ai";
import { setItemContent, setItemTranslations } from "../../lib/editTrip";
import type { ItemTranslation } from "../../types";
import { softDeleteTrip } from "../../lib/trips";
import { cn } from "../../lib/cn";
import { ui, seg } from "../../lib/ui";
import { DaysTab } from "./DaysTab";
import { SettingsTab } from "./SettingsTab";
import { ItemEditScreen } from "./ItemEditScreen";
import { FlightEditScreen } from "./FlightEditScreen";
import { StayEditScreen } from "./StayEditScreen";

interface EditorProps {
  tripId: string;
  onBack: () => void;
  onPreview: (tripId: string) => void;
  showToast: (msg: string) => void;
  /** Called after the trip has been deleted, to leave the editor. */
  onDeleted: () => void;
}

/** Which entity (if any) is open in a full-screen edit screen. */
type Editing =
  | { type: "item"; di: number; ii: number }
  | { type: "flight"; di: number; fi: number }
  | { type: "stay"; di: number }
  | null;

export function Editor({
  tripId,
  onBack,
  onPreview,
  showToast,
  onDeleted,
}: EditorProps) {
  const editor = useTripEditor(tripId);
  const [tab, setTab] = useState<"days" | "settings">("days");
  const [adminDay, setAdminDay] = useState(0);
  const [aiBusyKey, setAiBusyKey] = useState("");
  const [editing, setEditing] = useState<Editing>(null);

  const { trip, loading, saving, update, set, publish } = editor;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-app-bg font-semibold text-faint">
        Loading trip…
      </div>
    );
  }
  if (!trip) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-[14px] bg-app-bg p-[30px] text-center">
        <div className="text-[18px] font-bold">
          That trip could not be loaded.
        </div>
        <button
          onClick={onBack}
          className={cn(ui.btnGhost, "w-auto px-5 py-0")}
        >
          Back to trips
        </button>
      </div>
    );
  }

  const dayCount = trip.days.length;
  const goDay = (i: number) =>
    setAdminDay(Math.max(0, Math.min(dayCount - 1, i)));

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
      const langs = trip.languages ?? [];
      const base = { ...item, note, ...(image ? { image } : {}) };
      let translations: Record<string, ItemTranslation> = {};
      if (langs.length > 0) {
        try {
          translations = await translateItem(base, langs, dest);
        } catch {
          showToast(
            "Saved description, but translation failed. Try Translate again.",
          );
        }
      }
      // No photo found → leave the thumbnail blank, don't overwrite an existing one.
      update((t) => {
        let next = setItemContent(
          t,
          di,
          ii,
          image ? { note, image } : { note },
        );
        if (Object.keys(translations).length > 0) {
          next = setItemTranslations(next, di, ii, translations);
        }
        return next;
      });
    } catch (e: unknown) {
      showToast(
        e instanceof Error
          ? e.message
          : "AI could not generate content. Check Firebase AI Logic is enabled.",
      );
    } finally {
      setAiBusyKey("");
    }
  };

  const handlePublish = async () => {
    await publish();
    showToast("Published — travelers now see the latest itinerary.");
  };

  const handleDelete = async () => {
    try {
      await softDeleteTrip(tripId);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Could not delete the trip.");
      throw e; // let the Settings tab re-enable its confirm controls
    }
    showToast("Trip deleted.");
    onDeleted();
  };

  // A full-screen edit screen replaces the whole editor chrome while open.
  const closeEditing = () => setEditing(null);
  if (editing?.type === "item") {
    return (
      <ItemEditScreen
        trip={trip}
        di={editing.di}
        ii={editing.ii}
        update={update}
        onBack={closeEditing}
        onAskAI={askAI}
        aiBusyKey={aiBusyKey}
        saving={saving}
      />
    );
  }
  if (editing?.type === "flight") {
    return (
      <FlightEditScreen
        trip={trip}
        di={editing.di}
        fi={editing.fi}
        update={update}
        onBack={closeEditing}
        saving={saving}
      />
    );
  }
  if (editing?.type === "stay") {
    return (
      <StayEditScreen
        trip={trip}
        di={editing.di}
        update={update}
        onBack={closeEditing}
        saving={saving}
      />
    );
  }

  return (
    <div className="flex h-full flex-col bg-app-bg">
      <div className="flex shrink-0 items-center gap-[10px] px-4 pt-[max(env(safe-area-inset-top),14px)] pb-3">
        <button
          onClick={onBack}
          aria-label="Back to trips"
          className={cn(ui.chevBtn, "h-[44px] w-[44px]")}
        >
          <ChevronLeft size={22} color="#7A6F60" strokeWidth={2.6} />
        </button>
        <div className="min-w-0 flex-1 overflow-hidden text-[20px] font-extrabold tracking-[-0.3px] text-ellipsis whitespace-nowrap">
          Edit trip
          {saving && (
            <span className="ml-2 text-[12px] font-semibold text-fainter">
              saving…
            </span>
          )}
        </div>
        <button
          onClick={handlePublish}
          className="cursor-pointer rounded-[13px] bg-accent px-[18px] py-[11px] text-[15px] font-extrabold text-white shadow-[0_6px_14px_rgba(194,84,31,0.28)]"
        >
          Publish
        </button>
      </div>

      <div className="shrink-0 px-[18px] pt-1 pb-3">
        <div className="flex gap-1 rounded-md bg-[#f0e9de] p-1">
          <button
            onClick={() => setTab("days")}
            className={seg(tab === "days")}
          >
            Itinerary
          </button>
          <button
            onClick={() => setTab("settings")}
            className={seg(tab === "settings")}
          >
            Settings
          </button>
        </div>
      </div>

      <div
        className={cn(
          "no-scrollbar",
          "min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-[18px] pt-1 pb-[26px]",
        )}
      >
        {tab === "days" ? (
          <DaysTab
            trip={trip}
            dayIndex={adminDay}
            onSelectDay={goDay}
            onPrevDay={() => goDay(adminDay - 1)}
            onNextDay={() => goDay(adminDay + 1)}
            update={update}
            onOpenItem={(di, ii) => setEditing({ type: "item", di, ii })}
            onOpenFlight={(di, fi) => setEditing({ type: "flight", di, fi })}
            onOpenStay={(di) => setEditing({ type: "stay", di })}
          />
        ) : (
          <SettingsTab
            trip={trip}
            update={update}
            set={set}
            onPublish={handlePublish}
            onPreview={() => onPreview(trip.id)}
            onToast={showToast}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
