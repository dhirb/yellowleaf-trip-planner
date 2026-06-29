import type { ItemKind, ItemTranslation, Trip } from "../../types";
import { imgFor } from "../../lib/dayView";
import { bigDate } from "../../lib/date";
import { cn } from "../../lib/cn";
import {
  delItem,
  setItemContent,
  setItemTranslations,
  updateItem,
} from "../../lib/editTrip";
import { makeTranslationHandlers } from "../../lib/translateHandlers";
import { Image as ImageIcon, Sparkles } from "lucide-react";
import { EditScreenShell } from "./EditScreenShell";
import { ActionBar } from "../ui/ActionBar";
import { Select } from "../ui/Select";
import { EditableField, Field, fieldInput } from "./editFields";
import { TranslatableField } from "./TranslatableField";

interface ItemEditScreenProps {
  trip: Trip;
  di: number;
  ii: number;
  update: (updater: (t: Trip) => Trip) => void;
  onBack: () => void;
  /** Reassign this activity to another day (for last-minute reschedules). */
  onChangeDay: (toDi: number) => void;
  /** Generate the activity description from its name. */
  onAskDescription: (di: number, ii: number) => void;
  /** Find a real photo for the activity thumbnail. */
  onAskImage: (di: number, ii: number) => void;
  aiBusyKey: string;
  saving: boolean;
}

const KIND_OPTIONS: { value: ItemKind; label: string }[] = [
  { value: "attraction", label: "Attraction" },
  { value: "meal", label: "Meal" },
  { value: "stay", label: "Stay" },
  { value: "transport", label: "Transport" },
  { value: "other", label: "Other" },
];

export function ItemEditScreen({
  trip,
  di,
  ii,
  update,
  onBack,
  onChangeDay,
  onAskDescription,
  onAskImage,
  aiBusyKey,
  saving,
}: ItemEditScreenProps) {
  const day = trip.days[di];
  const item = day?.items[ii];
  // Defensive: the item can vanish (e.g. after a remote edit) — bail rather
  // than render against a stale index.
  if (!item) return null;

  // Two separate AI assists with independent busy keys, so finding a photo
  // doesn't disable the description button (and vice versa).
  const busyNote = aiBusyKey === `${di}-${ii}:note`;
  const busyImage = aiBusyKey === `${di}-${ii}:image`;
  const thumb = imgFor(item);
  const langs = trip.languages ?? [];
  const dest = `${trip.dest}, ${trip.country}`;

  // A trip with a single day has nowhere to move the activity to.
  const canChangeDay = trip.days.length > 1;
  const dayOptions = trip.days.map((d, i) => ({
    value: String(i),
    label: `Day ${i + 1} — ${bigDate(d.date)}`,
  }));

  const { setTrans, translateInto } = makeTranslationHandlers<ItemTranslation>(
    update,
    (t, map) => setItemTranslations(t, di, ii, map),
    langs,
    dest,
  );

  return (
    <EditScreenShell title="Edit activity" onBack={onBack} saving={saving}>
      {/* Thumbnail */}
      <Field label="Thumbnail" className="mb-[10px]">
        {thumb ? (
          <div
            className="mb-[10px] h-[150px] w-full rounded-lg shadow-[0_6px_18px_rgba(0,0,0,0.12)]"
            style={{ background: `center/cover url("${thumb}")` }}
          />
        ) : (
          <div className="mb-[10px] flex h-[150px] w-full items-center justify-center rounded-lg border border-dashed border-border bg-surface text-faint">
            <ImageIcon size={28} strokeWidth={2} />
          </div>
        )}
        <input
          type="url"
          inputMode="url"
          value={item.image ?? ""}
          onChange={(e) =>
            update((t) => setItemContent(t, di, ii, { image: e.target.value }))
          }
          aria-label="Image URL"
          placeholder="Image URL…"
          className={fieldInput}
        />
      </Field>
      <button
        type="button"
        onClick={() => onAskImage(di, ii)}
        disabled={busyImage}
        className={cn(
          "mb-[18px] flex h-12 w-full items-center justify-center gap-[6px] rounded-sm bg-ink px-[14px] text-[14px] font-extrabold text-app-bg touch-manipulation",
          busyImage
            ? "cursor-default opacity-70"
            : "cursor-pointer opacity-100",
        )}
      >
        <ImageIcon size={16} />
        {busyImage ? "Finding photo…" : "Find photo with AI"}
      </button>

      {/* Day — reassign the activity to another day in the trip */}
      {canChangeDay && (
        <Field label="Day" className="mb-[18px]">
          <Select
            value={String(di)}
            ariaLabel="Day"
            options={dayOptions}
            onChange={(v) => onChangeDay(Number(v))}
            className={fieldInput}
          />
        </Field>
      )}

      {/* Time + Ask AI */}
      <div className="mb-[18px] flex items-end gap-3">
        <EditableField
          label="Time"
          className="mb-0 w-[150px] shrink-0"
          type="time"
          bold
          value={item.time}
          onChange={(v) => update((t) => updateItem(t, di, ii, "time", v))}
          ariaLabel="Activity time"
        />
        <button
          onClick={() => onAskDescription(di, ii)}
          disabled={busyNote}
          className={cn(
            "flex h-12 min-w-0 flex-1 items-center justify-center gap-[6px] rounded-sm bg-ink px-[14px] text-[14px] font-extrabold text-app-bg touch-manipulation",
            busyNote
              ? "cursor-default opacity-70"
              : "cursor-pointer opacity-100",
          )}
        >
          <Sparkles size={16} />
          {busyNote ? "Generating…" : "Ask AI"}
        </button>
      </div>

      {/* Name */}
      <TranslatableField
        label="Name"
        value={item.title}
        onChange={(v) => update((t) => updateItem(t, di, ii, "title", v))}
        langs={langs}
        translations={item.t}
        field="title"
        onChangeTranslation={setTrans("title")}
        onTranslate={translateInto("title", item.title)}
        placeholder="Name…"
      />

      {/* Place */}
      <TranslatableField
        label="Place"
        value={item.place ?? ""}
        onChange={(v) => update((t) => updateItem(t, di, ii, "place", v))}
        langs={langs}
        translations={item.t}
        field="place"
        onChangeTranslation={setTrans("place")}
        onTranslate={translateInto("place", item.place ?? "")}
        placeholder="Location / area…"
      />

      {/* Tag */}
      <TranslatableField
        label="Tag"
        value={item.tag ?? ""}
        onChange={(v) => update((t) => updateItem(t, di, ii, "tag", v))}
        langs={langs}
        translations={item.t}
        field="tag"
        onChangeTranslation={setTrans("tag")}
        onTranslate={translateInto("tag", item.tag ?? "")}
        placeholder="Short label (e.g. Temple)…"
      />

      {/* Category + Cost */}
      <div className="flex gap-3">
        <Field label="Category" className="flex-1">
          <Select
            value={item.kind}
            ariaLabel="Category"
            options={KIND_OPTIONS}
            onChange={(kind) =>
              update((t) => updateItem(t, di, ii, "kind", kind))
            }
            className={fieldInput}
          />
        </Field>
        <EditableField
          label="Cost"
          className="flex-1"
          value={item.cost ?? ""}
          onChange={(v) => update((t) => updateItem(t, di, ii, "cost", v))}
          ariaLabel="Cost"
          placeholder="e.g. ¥500"
        />
      </div>

      {/* Description */}
      <TranslatableField
        label="Description"
        value={item.note ?? ""}
        onChange={(v) => update((t) => setItemContent(t, di, ii, { note: v }))}
        langs={langs}
        translations={item.t}
        field="note"
        onChangeTranslation={setTrans("note")}
        onTranslate={translateInto("note", item.note ?? "")}
        placeholder="Description…"
        multiline
      />

      {/* Tip */}
      <TranslatableField
        label="Tip"
        value={item.tip ?? ""}
        onChange={(v) => update((t) => setItemContent(t, di, ii, { tip: v }))}
        langs={langs}
        translations={item.t}
        field="tip"
        onChangeTranslation={setTrans("tip")}
        onTranslate={translateInto("tip", item.tip ?? "")}
        placeholder="Tip (amber callout)…"
      />

      <ActionBar
        onDelete={() => {
          update((t) => delItem(t, di, ii));
          onBack();
        }}
      />
    </EditScreenShell>
  );
}
