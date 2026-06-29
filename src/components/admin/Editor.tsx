import { useState } from "react";
import { ChevronLeft, Settings } from "lucide-react";
import { useTripEditor } from "../../hooks/useTripEditor";
import {
  generateActivityDescription,
  generateActivityImage,
} from "../../lib/ai";
import {
  moveItemToDay,
  setItemContent,
  timeInsertIndex,
} from "../../lib/editTrip";
import { softDeleteTrip } from "../../lib/trips";
import { cn } from "../../lib/cn";
import { ui } from "../../lib/ui";
import { DaysTab } from "./DaysTab";
import { SettingsTab } from "./SettingsTab";
import { ItemEditScreen } from "./ItemEditScreen";
import { FlightEditScreen } from "./FlightEditScreen";
import { StayEditScreen } from "./StayEditScreen";

interface EditorProps {
  tripId: string;
  onBack: () => void;
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

export function Editor({ tripId, onBack, showToast, onDeleted }: EditorProps) {
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

  // Two independent AI assists, each with its own busy key so one can run (and
  // show its spinner) without disabling the other. Translation is intentionally
  // not batched here — it lives per-field on the edit screen.

  // Write a description from the activity's name.
  const askAIDescription = async (di: number, ii: number) => {
    setAiBusyKey(`${di}-${ii}:note`);
    const item = trip.days[di].items[ii];
    const dest = `${trip.dest}, ${trip.country}`;
    try {
      const note = await generateActivityDescription(item.title, dest);
      update((t) => setItemContent(t, di, ii, { note }));
    } catch (e: unknown) {
      showToast(
        e instanceof Error
          ? e.message
          : "AI could not generate a description. Check Firebase AI Logic is enabled.",
      );
    } finally {
      setAiBusyKey("");
    }
  };

  // Find a real photo for the activity. A miss is a valid outcome, not an
  // error, and never overwrites an existing thumbnail with a blank.
  const askAIImage = async (di: number, ii: number) => {
    setAiBusyKey(`${di}-${ii}:image`);
    const item = trip.days[di].items[ii];
    const dest = `${trip.dest}, ${trip.country}`;
    try {
      const image = await generateActivityImage(item.title, dest);
      if (image) {
        update((t) => setItemContent(t, di, ii, { image }));
      } else {
        showToast("No photo was found for this activity.");
      }
    } catch (e: unknown) {
      showToast(
        e instanceof Error ? e.message : "Could not search for a photo.",
      );
    } finally {
      setAiBusyKey("");
    }
  };

  // Reassign the activity currently open in the editor to another day. The
  // edit screen addresses items by (di, ii), so after the move we recompute the
  // item's new location and keep the screen open on it. The target day differs
  // from the source, so removing the item from the source day does not shift the
  // target day's indices — the pre-move insertion index is the final position.
  const moveEditingItemToDay = (toDi: number) => {
    if (editing?.type !== "item") return;
    const { di: fromDi, ii } = editing;
    if (toDi === fromDi) return;
    const moved = trip.days[fromDi].items[ii];
    const newIi = timeInsertIndex(trip.days[toDi].items, moved.time);
    update((t) => moveItemToDay(t, fromDi, ii, toDi));
    setEditing({ type: "item", di: toDi, ii: newIi });
    setAdminDay(toDi);
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
        onChangeDay={moveEditingItemToDay}
        onAskDescription={askAIDescription}
        onAskImage={askAIImage}
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
          onClick={() => (tab === "settings" ? setTab("days") : onBack())}
          aria-label={
            tab === "settings" ? "Back to itinerary" : "Back to trips"
          }
          className={cn(ui.chevBtn, "h-[44px] w-[44px]")}
        >
          <ChevronLeft size={22} color="#7A6F60" strokeWidth={2.6} />
        </button>
        <div className="min-w-0 flex-1 overflow-hidden text-[20px] font-extrabold tracking-[-0.3px] text-ellipsis whitespace-nowrap">
          {tab === "settings" ? "Settings" : trip.title}
          {saving && (
            <span className="ml-2 text-[12px] font-semibold text-fainter">
              saving…
            </span>
          )}
        </div>
        {tab !== "settings" && (
          <button
            onClick={() => setTab("settings")}
            aria-label="Trip settings"
            className={cn(ui.chevBtn, "h-[44px] w-[44px]")}
          >
            <Settings size={20} color="#7A6F60" strokeWidth={2.4} />
          </button>
        )}
      </div>

      {tab === "days" ? (
        // The day pager fills the area and scrolls each panel internally, so the
        // whole page (header, strip, content) travels with the swipe.
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
        <div
          className={cn(
            "no-scrollbar",
            "min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-[18px] pt-1 pb-[26px]",
          )}
        >
          <SettingsTab
            trip={trip}
            update={update}
            set={set}
            onPublish={handlePublish}
            onToast={showToast}
            onDelete={handleDelete}
          />
        </div>
      )}
    </div>
  );
}
