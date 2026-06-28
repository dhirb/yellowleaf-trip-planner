import type { StayTranslation, Trip } from "../../types";
import { clearStay, setStayTranslations, updateStay } from "../../lib/editTrip";
import { makeTranslationHandlers } from "../../lib/translateHandlers";
import { EditScreenShell } from "./EditScreenShell";
import { ActionBar } from "../ui/ActionBar";
import { TranslatableField } from "./TranslatableField";
import { EditableField } from "./editFields";

interface StayEditScreenProps {
  trip: Trip;
  di: number;
  update: (updater: (t: Trip) => Trip) => void;
  onBack: () => void;
  saving: boolean;
}

export function StayEditScreen({
  trip,
  di,
  update,
  onBack,
  saving,
}: StayEditScreenProps) {
  const day = trip.days[di];
  if (!day) return null;

  // `stay` may be null when adding; `updateStay` creates it on first keystroke.
  const stay = day.stay;
  const langs = trip.languages ?? [];

  const { setTrans, translateInto } = makeTranslationHandlers<StayTranslation>(
    update,
    (t, map) => setStayTranslations(t, di, map),
    langs,
  );

  return (
    <EditScreenShell title="Edit accommodation" onBack={onBack} saving={saving}>
      <TranslatableField
        label="Hotel name"
        value={stay?.name ?? ""}
        onChange={(v) => update((t) => updateStay(t, di, "name", v))}
        langs={langs}
        translations={stay?.t}
        field="name"
        onChangeTranslation={setTrans("name")}
        onTranslate={translateInto("name", stay?.name ?? "")}
        placeholder="Hotel name…"
      />

      <TranslatableField
        label="Description"
        value={stay?.desc ?? ""}
        onChange={(v) => update((t) => updateStay(t, di, "desc", v))}
        langs={langs}
        translations={stay?.t}
        field="desc"
        onChangeTranslation={setTrans("desc")}
        onTranslate={translateInto("desc", stay?.desc ?? "")}
        placeholder="Short description…"
      />

      <EditableField
        label="Address"
        value={stay?.address ?? ""}
        onChange={(v) => update((t) => updateStay(t, di, "address", v))}
        ariaLabel="Address"
        placeholder="Street address…"
      />

      <EditableField
        label="Phone"
        type="tel"
        value={stay?.phone ?? ""}
        onChange={(v) => update((t) => updateStay(t, di, "phone", v))}
        ariaLabel="Phone"
        placeholder="+86 20 1234 5678"
      />

      <TranslatableField
        label="Note"
        value={stay?.note ?? ""}
        onChange={(v) => update((t) => updateStay(t, di, "note", v))}
        langs={langs}
        translations={stay?.t}
        field="note"
        onChangeTranslation={setTrans("note")}
        onTranslate={translateInto("note", stay?.note ?? "")}
        placeholder="Booking details, room count, check-in notes…"
        multiline
      />

      {stay && (
        <ActionBar
          deleteLabel="Remove accommodation"
          onDelete={() => {
            update((t) => clearStay(t, di));
            onBack();
          }}
        />
      )}
    </EditScreenShell>
  );
}
