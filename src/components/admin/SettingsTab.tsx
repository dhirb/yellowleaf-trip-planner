import { useState } from "react";
import type { Trip } from "../../types";
import { cn } from "../../lib/cn";
import { ui, contactColor } from "../../lib/ui";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { Plus, Trash2 } from "lucide-react";
import {
  addContact,
  addCoOwner,
  addTripLanguage,
  delContact,
  isValidEmail,
  moveContact,
  removeCoOwner,
  removeTripLanguage,
  setTripEnd,
  setTripField,
  setTripStart,
  updateContact,
} from "../../lib/editTrip";
import { LANGUAGE_PRESETS } from "../../lib/languages";
import { ReorderControls } from "../ui/ReorderControls";
import { useAuth } from "../../hooks/useAuth";

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

const CONTACT_KIND_OPTIONS = [
  { value: "emergency", label: "Emergency" },
  { value: "family", label: "Family" },
  { value: "hotel", label: "Hotel" },
  { value: "embassy", label: "Embassy" },
  { value: "other", label: "Other" },
];

export function SettingsTab({
  trip,
  update,
  set,
  onPublish,
  onPreview,
  onToast,
  onDelete,
}: SettingsTabProps) {
  const { user } = useAuth();
  const start = trip.days[0].date;
  const end = trip.days[trip.days.length - 1].date;
  const shareLink = `${window.location.origin}/t/${trip.id}`;
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [coOwnerEmail, setCoOwnerEmail] = useState("");

  // Only the original owner manages access; co-owners see the list read-only.
  const isPrimaryOwner = trip.ownerId === user?.uid;
  const coOwners = trip.coOwnerEmails ?? [];

  const addCoOwnerEmail = () => {
    const email = coOwnerEmail.trim().toLowerCase();
    if (!isValidEmail(email)) {
      onToast("Enter a valid email address.");
      return;
    }
    if (coOwners.includes(email)) {
      onToast("That person is already a co-owner.");
      return;
    }
    update((t) => addCoOwner(t, email));
    setCoOwnerEmail("");
    onToast("Co-owner added");
  };

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

      {/* Languages */}
      <div className={cn(ui.padCard, "mb-4")}>
        <Label>Languages</Label>
        <div className="mb-3 text-[13.5px] font-medium leading-[1.45] text-muted">
          English is always shown. Add languages travelers can switch to;
          activity and accommodation text can then be translated from the
          itinerary editor.
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
        <Select
          value=""
          ariaLabel="Add a language"
          placeholder="Add a language…"
          options={LANGUAGE_PRESETS.filter(
            (p) => !(trip.languages ?? []).some((l) => l.code === p.code),
          ).map((p) => ({ value: p.code, label: p.label }))}
          onChange={(code) => {
            const lang = LANGUAGE_PRESETS.find((l) => l.code === code);
            if (lang) update((t) => addTripLanguage(t, lang));
          }}
          className={cn(ui.input, "h-12 font-semibold")}
        />
      </div>

      {/* Co-owners */}
      <div className={cn(ui.padCard, "mb-4")}>
        <Label>Co-owners</Label>
        <div className="mb-3 text-[13.5px] font-medium leading-[1.45] text-muted">
          {isPrimaryOwner
            ? "Co-owners can edit this trip alongside you. Add them by the email on their account — they must already be able to sign in. Only you can manage this list or delete the trip."
            : "These people can edit this trip. Only the trip's owner can change who has access."}
        </div>
        {coOwners.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {coOwners.map((email) => (
              <span
                key={email}
                className="flex items-center gap-2 rounded-pill bg-control px-[12px] py-[7px] text-[13.5px] font-bold text-ink-dim"
              >
                {email}
                {isPrimaryOwner && (
                  <button
                    onClick={() => update((t) => removeCoOwner(t, email))}
                    aria-label={`Remove ${email}`}
                    className="flex h-[18px] w-[18px] cursor-pointer items-center justify-center rounded-full bg-[#e3dacb]"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
        {isPrimaryOwner && (
          <div className="flex items-center gap-[10px]">
            <input
              type="email"
              value={coOwnerEmail}
              onChange={(e) => setCoOwnerEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCoOwnerEmail();
                }
              }}
              placeholder="name@example.com"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className={cn(ui.input, "h-12 min-w-0 flex-1 font-semibold")}
            />
            <button
              onClick={addCoOwnerEmail}
              className="flex h-12 shrink-0 cursor-pointer items-center rounded-[13px] bg-ink px-[18px] py-0 text-[14.5px] font-extrabold text-white"
            >
              Add
            </button>
          </div>
        )}
        {!isPrimaryOwner && coOwners.length === 0 && (
          <div className="text-[13.5px] font-medium text-faint">
            No co-owners yet.
          </div>
        )}
      </div>

      {/* Share link */}
      <div className={cn(ui.padCard, "mb-4")}>
        <Label>Share link</Label>
        <div className="mb-3 text-[13.5px] font-medium leading-[1.45] text-muted">
          Anyone with this link can open the trip once it&rsquo;s published. The
          link is long and unguessable, so keep the trip private simply by
          sharing it only with your travelers. Unpublished drafts aren&rsquo;t
          viewable by anyone but you.
        </div>
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
              <label
                className="relative h-[26px] w-[26px] shrink-0 cursor-pointer rounded-full border border-black/10"
                style={{ background: contactColor(c) }}
                title="Change colour"
              >
                <span className="sr-only">Contact colour</span>
                <input
                  type="color"
                  value={contactColor(c)}
                  onChange={(e) =>
                    update((t) => updateContact(t, ci, "color", e.target.value))
                  }
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
              <Select
                value={c.kind}
                ariaLabel="Contact type"
                wrapperClassName="min-w-0 flex-1"
                options={CONTACT_KIND_OPTIONS}
                onChange={(kind) =>
                  update((t) => updateContact(t, ci, "kind", kind))
                }
                className={cn(contactInput, "w-full text-[16px] font-bold")}
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
            <input
              value={c.label}
              onChange={(e) =>
                update((t) => updateContact(t, ci, "label", e.target.value))
              }
              placeholder="Name"
              className={cn(contactInput, "mb-2 w-full font-bold")}
            />
            <input
              value={c.value}
              onChange={(e) =>
                update((t) => updateContact(t, ci, "value", e.target.value))
              }
              placeholder="Phone number or URL"
              className={cn(contactInput, "w-full font-semibold")}
            />
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
