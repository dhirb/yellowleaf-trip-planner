import { useState } from "react";
import type { Trip } from "../../types";
import { cn } from "../../lib/cn";
import { ui } from "../../lib/ui";
import { Button } from "../ui/Button";
import { Plus, Trash2 } from "lucide-react";
import { CONTACT_COLOR } from "../../lib/ui";
import {
  addContact,
  addTripLanguage,
  delContact,
  moveContact,
  removeTripLanguage,
  setTripEnd,
  setTripField,
  setTripStart,
  toggleVisibility,
  updateContact,
} from "../../lib/editTrip";
import { LANGUAGE_PRESETS } from "../../lib/languages";
import { ReorderControls } from "../ui/ReorderControls";

interface SettingsTabProps {
  trip: Trip;
  update: (updater: (t: Trip) => Trip) => void;
  set: (next: Trip) => void;
  onPublish: () => void;
  onPreview: () => void;
  onToast: (msg: string) => void;
  /** Permanently delete this trip. Rejects (after toasting) on failure. */
  onDelete: () => Promise<void>;
}

const Label = ({ children, mt = 0 }: { children: string; mt?: number }) => (
  <div
    className="mb-[10px] text-[12px] font-extrabold uppercase tracking-[0.6px] text-faint"
    style={{ marginTop: mt }}
  >
    {children}
  </div>
);

const contactInput =
  "h-10 rounded-sm border border-border-strong bg-surface px-[10px] py-0 text-[14px] text-ink outline-none";

export function SettingsTab({
  trip,
  update,
  set,
  onPublish,
  onPreview,
  onToast,
  onDelete,
}: SettingsTabProps) {
  const start = trip.days[0].date;
  const end = trip.days[trip.days.length - 1].date;
  const shareLink = `${window.location.origin}/t/${trip.id}`;
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
      // On success this tab unmounts (back to the trips list); no reset needed.
    } catch {
      // onDelete already surfaced a toast; let the admin retry or cancel.
      setDeleting(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      onToast("Link copied to clipboard");
    } catch {
      onToast("Could not copy — select and copy the link manually.");
    }
  };

  return (
    <>
      {/* Name + dates */}
      <div className={cn(ui.padCard, "mb-4")}>
        <Label>Trip name</Label>
        <input
          value={trip.title}
          onChange={(e) =>
            update((t) => setTripField(t, "title", e.target.value))
          }
          className={cn(ui.input, "font-bold")}
        />
        <Label mt={18}>Trip dates</Label>
        <div className="flex flex-col gap-[14px]">
          <div>
            <div className="mb-[5px] text-[12px] font-bold text-ink-dim">
              Start
            </div>
            <input
              type="date"
              value={start}
              onChange={(e) => set(setTripStart(trip, e.target.value))}
              className={cn(ui.input, "h-12 font-semibold")}
            />
          </div>
          <div>
            <div className="mb-[5px] text-[12px] font-bold text-ink-dim">
              End
            </div>
            <input
              type="date"
              value={end}
              min={start}
              onChange={(e) => {
                const next = setTripEnd(trip, e.target.value);
                if (next) set(next);
                else onToast("End date must be on or after the start.");
              }}
              className={cn(ui.input, "h-12 font-semibold")}
            />
          </div>
        </div>
      </div>

      {/* Visibility */}
      <div className={cn(ui.padCard, "mb-4")}>
        <Label>Who can view this trip</Label>
        <button
          onClick={() => update(toggleVisibility)}
          className="flex w-full cursor-pointer items-center gap-[13px] bg-transparent p-0 text-left"
        >
          <div
            className={cn(
              "relative h-8 w-[52px] shrink-0 rounded-pill transition-colors duration-200",
              trip.visibility === "public" ? "bg-meal" : "bg-[#d9cfbe]",
            )}
          >
            <div
              className="absolute top-[3px] h-[26px] w-[26px] rounded-full bg-surface shadow-[0_2px_5px_rgba(0,0,0,0.2)] transition-[left] duration-200"
              style={{ left: trip.visibility === "public" ? 23 : 3 }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[16.5px] font-bold">
              {trip.visibility === "public"
                ? "Public — anyone with the link"
                : "Private — code required"}
            </div>
            <div className="mt-px text-[13.5px] font-medium leading-[1.4] text-muted">
              {trip.visibility === "public"
                ? "Travelers open the link directly. No code needed."
                : "Travelers must enter the access code below to view."}
            </div>
          </div>
        </button>
        {trip.visibility === "private" && (
          <div className="mt-4">
            <div className="mb-[7px] text-[13px] font-bold text-ink-dim">
              Access code
            </div>
            <input
              value={trip.password}
              onChange={(e) =>
                update((t) => setTripField(t, "password", e.target.value))
              }
              className={cn(ui.input, "font-bold tracking-[0.5px]")}
            />
          </div>
        )}
      </div>

      {/* Languages */}
      <div className={cn(ui.padCard, "mb-4")}>
        <Label>Languages</Label>
        <div className="mb-3 text-[13.5px] font-medium leading-[1.45] text-muted">
          English is always shown. Add languages travelers can switch to; activity and
          accommodation text can then be translated from the itinerary editor.
        </div>
        {(trip.languages ?? []).length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {(trip.languages ?? []).map((l) => (
              <span
                key={l.code}
                className="flex items-center gap-2 rounded-pill bg-control px-[12px] py-[7px] text-[13.5px] font-bold text-ink-dim"
              >
                {l.label}
                <button
                  onClick={() => update((t) => removeTripLanguage(t, l.code))}
                  aria-label={`Remove ${l.label}`}
                  className="flex h-[18px] w-[18px] cursor-pointer items-center justify-center rounded-full bg-[#e3dacb]"
                >
                  <Trash2 size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
        <select
          value=""
          onChange={(e) => {
            const lang = LANGUAGE_PRESETS.find((l) => l.code === e.target.value);
            if (lang) update((t) => addTripLanguage(t, lang));
          }}
          className={cn(ui.input, "h-12 font-semibold")}
        >
          <option value="" disabled>
            Add a language…
          </option>
          {LANGUAGE_PRESETS.filter(
            (p) => !(trip.languages ?? []).some((l) => l.code === p.code),
          ).map((p) => (
            <option key={p.code} value={p.code}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Share link */}
      <div className={cn(ui.padCard, "mb-4")}>
        <Label>Share link</Label>
        <div className="flex items-center gap-[10px]">
          <div className="flex h-[50px] min-w-0 flex-1 items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-[13px] border border-[#ece4d8] bg-surface-sunken px-[14px] py-0 text-[15px] font-bold text-ink-dim">
            {shareLink}
          </div>
          <button
            onClick={copyLink}
            className="flex h-[50px] shrink-0 cursor-pointer items-center rounded-[13px] bg-ink px-[18px] py-0 text-[14.5px] font-extrabold text-white"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Contacts */}
      <div className={cn(ui.padCard, "mb-4")}>
        <Label>Important contacts</Label>
        {trip.contacts.map((c, ci) => (
          <div
            key={ci}
            className="mb-[10px] rounded-md border border-[#ece4d8] bg-[#f8f4ed] p-[10px]"
          >
            <div className="mb-2 flex items-center gap-2">
              <div
                className="h-[13px] w-[13px] shrink-0 rounded-full"
                style={{ background: CONTACT_COLOR[c.kind] ?? "#8A8175" }}
              />
              <input
                value={c.label}
                onChange={(e) =>
                  update((t) => updateContact(t, ci, "label", e.target.value))
                }
                placeholder="Name"
                className={cn(contactInput, "min-w-0 flex-1 font-bold")}
              />
              <ReorderControls
                canUp={ci > 0}
                canDown={ci < trip.contacts.length - 1}
                onUp={() => update((t) => moveContact(t, ci, ci - 1))}
                onDown={() => update((t) => moveContact(t, ci, ci + 1))}
              />
              <button
                onClick={() => update((t) => delContact(t, ci))}
                aria-label="Remove contact"
                className="flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-[9px] bg-[#fbeeec] text-[#b4453a]"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                value={c.value}
                onChange={(e) =>
                  update((t) => updateContact(t, ci, "value", e.target.value))
                }
                placeholder="Phone number"
                className={cn(contactInput, "min-w-0 flex-1 font-semibold")}
              />
              <select
                value={c.kind}
                onChange={(e) =>
                  update((t) => updateContact(t, ci, "kind", e.target.value))
                }
                className={cn(
                  contactInput,
                  "w-[120px] shrink-0 appearance-none px-2 text-[13.5px] font-bold",
                )}
              >
                <option value="emergency">Emergency</option>
                <option value="family">Family</option>
                <option value="hotel">Hotel</option>
                <option value="embassy">Embassy</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        ))}
        <button
          onClick={() => update(addContact)}
          className="flex h-11 w-full cursor-pointer items-center justify-center gap-[6px] rounded-[12px] border-[1.5px] border-dashed border-[#d9cfbe] bg-transparent text-[14px] font-bold text-muted"
        >
          <Plus size={16} color="#8A8175" strokeWidth={2.4} />
          Add contact
        </button>
      </div>

      <Button onClick={onPublish} className="mb-3">
        Publish changes
      </Button>
      <Button variant="ghost" onClick={onPreview}>
        Preview as traveler
      </Button>

      {/* Danger zone */}
      <div className={cn(ui.padCard, "mt-6 border-[#eccfc8]")}>
        <Label>Danger zone</Label>
        {!confirmingDelete ? (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="flex h-[54px] w-full cursor-pointer items-center justify-center rounded-[16px] border border-[#eccfc8] bg-[#fbeeec] text-[16px] font-bold text-[#C0392B]"
          >
            Delete trip
          </button>
        ) : (
          <>
            <div className="mb-3 text-[14px] font-medium leading-[1.45] text-muted">
              This permanently deletes{" "}
              <span className="font-bold text-ink">{trip.title}</span> and its
              share link. Travelers will no longer be able to open it. This
              can&rsquo;t be undone.
            </div>
            <div className="flex gap-[10px]">
              <button
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="h-[52px] flex-1 cursor-pointer rounded-[14px] border border-[#e3dacb] bg-surface text-[15px] font-bold text-ink disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="h-[52px] flex-1 cursor-pointer rounded-[14px] border-none bg-[#C0392B] text-[15px] font-extrabold text-white shadow-[0_6px_14px_rgba(192,57,43,0.3)] disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
