import type { StayTranslation, Trip } from "../../types";
import {
  delStay,
  setStayDates,
  setStayTranslations,
  updateStay,
} from "../../lib/editTrip";
import { makeTranslationHandlers } from "../../lib/translateHandlers";
import { stayNights } from "../../lib/stays";
import { cn } from "../../lib/cn";
import { EditScreenShell } from "./EditScreenShell";
import { ActionBar } from "../ui/ActionBar";
import { TranslatableField } from "./TranslatableField";
import { EditableField, Field, fieldInput } from "./editFields";

interface StayEditScreenProps {
  trip: Trip;
  /** Index into `trip.stays`. */
  si: number;
  update: (updater: (t: Trip) => Trip) => void;
  /** Wholesale replace, for the date edits that can be rejected. */
  set: (next: Trip) => void;
  onToast: (msg: string) => void;
  onBack: () => void;
  saving: boolean;
}

export function StayEditScreen({
  trip,
  si,
  update,
  set,
  onToast,
  onBack,
  saving,
}: StayEditScreenProps) {
  const stay = trip.stays[si];
  if (!stay) return null;

  const langs = trip.languages ?? [];
  const nights = stayNights(stay);

  const { setTrans, translateInto } = makeTranslationHandlers<StayTranslation>(
    update,
    (t, map) => setStayTranslations(t, si, map),
    langs,
  );

  const setDates = (checkIn: string, checkOut: string) => {
    // A date input reports "" mid-edit (and while the picker is open). There is
    // nothing to save, and handing `set` the unchanged trip would leave the
    // editor marked dirty with no save queued — which would stall live sync.
    if (!checkIn || !checkOut) return;
    const next = setStayDates(trip, si, checkIn, checkOut);
    if (!next) {
      onToast("Check-out must be at least one night after check-in.");
      return;
    }
    set(next);
  };

  return (
    <EditScreenShell title="Edit accommodation" onBack={onBack} saving={saving}>
      <TranslatableField
        label="Hotel name"
        value={stay.name}
        onChange={(v) => update((t) => updateStay(t, si, "name", v))}
        langs={langs}
        translations={stay.t}
        field="name"
        onChangeTranslation={setTrans("name")}
        onTranslate={translateInto("name", stay.name)}
        placeholder="Hotel name…"
      />

      <div className="flex gap-3">
        <Field label="Check-in" className="flex-1">
          <input
            type="date"
            value={stay.checkIn}
            onChange={(e) => setDates(e.target.value, stay.checkOut)}
            aria-label="Check-in"
            className={cn(fieldInput, "font-semibold")}
          />
        </Field>
        <Field label="Check-out" className="flex-1">
          <input
            type="date"
            value={stay.checkOut}
            min={stay.checkIn}
            onChange={(e) => setDates(stay.checkIn, e.target.value)}
            aria-label="Check-out"
            className={cn(fieldInput, "font-semibold")}
          />
        </Field>
      </div>
      <div className="-mt-[8px] mb-[18px] text-[13px] font-semibold text-faint">
        {nights} {nights === 1 ? "night" : "nights"} — the check-out date itself
        shows no accommodation.
      </div>

      <TranslatableField
        label="Description"
        value={stay.desc ?? ""}
        onChange={(v) => update((t) => updateStay(t, si, "desc", v))}
        langs={langs}
        translations={stay.t}
        field="desc"
        onChangeTranslation={setTrans("desc")}
        onTranslate={translateInto("desc", stay.desc ?? "")}
        placeholder="Short description…"
      />

      <EditableField
        label="Address"
        value={stay.address ?? ""}
        onChange={(v) => update((t) => updateStay(t, si, "address", v))}
        ariaLabel="Address"
        placeholder="Street address…"
      />

      <EditableField
        label="Phone"
        type="tel"
        value={stay.phone ?? ""}
        onChange={(v) => update((t) => updateStay(t, si, "phone", v))}
        ariaLabel="Phone"
        placeholder="+86 20 1234 5678"
      />

      <TranslatableField
        label="Note"
        value={stay.note ?? ""}
        onChange={(v) => update((t) => updateStay(t, si, "note", v))}
        langs={langs}
        translations={stay.t}
        field="note"
        onChangeTranslation={setTrans("note")}
        onTranslate={translateInto("note", stay.note ?? "")}
        placeholder="Booking details, room count, check-in notes…"
        multiline
      />

      <ActionBar
        deleteLabel="Remove accommodation"
        onDelete={() => {
          update((t) => delStay(t, si));
          onBack();
        }}
      />
    </EditScreenShell>
  );
}
