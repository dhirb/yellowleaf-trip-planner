import type { Trip } from "../../types";
import { cn } from "../../lib/cn";
import {
  addLayover,
  delFlight,
  delLayover,
  updateFlight,
  updateLayover,
} from "../../lib/editTrip";
import { ui } from "../../lib/ui";
import { EditScreenShell } from "./EditScreenShell";
import { ActionBar } from "../ui/ActionBar";
import { AirportField } from "./AirportField";
import { DurationField } from "./DurationField";
import { EditableField, Field } from "./editFields";
import { Plus, X } from "lucide-react";

interface FlightEditScreenProps {
  trip: Trip;
  di: number;
  fi: number;
  update: (updater: (t: Trip) => Trip) => void;
  onBack: () => void;
  saving: boolean;
}

export function FlightEditScreen({
  trip,
  di,
  fi,
  update,
  onBack,
  saving,
}: FlightEditScreenProps) {
  const day = trip.days[di];
  const flight = day?.flights[fi];
  if (!flight) return null;

  const layovers = flight.layovers ?? [];

  return (
    <EditScreenShell title="Edit flight" onBack={onBack} saving={saving}>
      <div className="flex gap-3">
        <EditableField
          label="Departure"
          className="flex-1"
          type="time"
          bold
          value={flight.depTime ?? ""}
          onChange={(v) => update((t) => updateFlight(t, di, fi, "depTime", v))}
          ariaLabel="Departure time"
        />
        <EditableField
          label="Arrival"
          className="flex-1"
          type="time"
          bold
          value={flight.arrTime ?? ""}
          onChange={(v) => update((t) => updateFlight(t, di, fi, "arrTime", v))}
          ariaLabel="Arrival time"
        />
      </div>

      <EditableField
        label="Flight number"
        bold
        value={flight.flightNo}
        onChange={(v) => update((t) => updateFlight(t, di, fi, "flightNo", v))}
        ariaLabel="Flight number"
        placeholder="e.g. CA168"
      />

      <Field label="From">
        <AirportField
          value={flight.from}
          onChange={(v) => update((t) => updateFlight(t, di, fi, "from", v))}
          ariaLabel="From"
          placeholder="From…"
          className="font-semibold"
        />
      </Field>
      <Field label="To">
        <AirportField
          value={flight.to}
          onChange={(v) => update((t) => updateFlight(t, di, fi, "to", v))}
          ariaLabel="To"
          placeholder="To…"
          className="font-semibold"
        />
      </Field>

      {/* Layovers — optional connecting stops, in order from origin to destination. */}
      <div className="mb-[18px]">
        <span className="mb-[7px] block text-[11.5px] font-extrabold uppercase tracking-[0.4px] text-faint">
          Layovers
        </span>
        {layovers.map((lo, li) => (
          <div key={li} className={cn(ui.padCard, "mb-3 p-[14px]")}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.3px] text-faint">
                Layover {li + 1}
              </span>
              <button
                type="button"
                onClick={() => update((t) => delLayover(t, di, fi, li))}
                aria-label={`Remove layover ${li + 1}`}
                className="flex h-7 w-7 items-center justify-center rounded-sm text-faint hover:text-ink"
              >
                <X size={16} strokeWidth={2.4} />
              </button>
            </div>
            <div className="mb-2">
              <AirportField
                value={lo.airport}
                onChange={(v) =>
                  update((t) => updateLayover(t, di, fi, li, "airport", v))
                }
                ariaLabel={`Layover ${li + 1} airport`}
                placeholder="Airport, e.g. Hong Kong (HKG)"
                className="font-semibold"
              />
            </div>
            <DurationField
              value={lo.duration}
              onChange={(v) =>
                update((t) => updateLayover(t, di, fi, li, "duration", v))
              }
              ariaLabel={`Layover ${li + 1} duration`}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => update((t) => addLayover(t, di, fi))}
          className="mt-1 flex items-center gap-1.5 text-[13px] font-bold text-accent"
        >
          <Plus size={16} strokeWidth={2.6} />
          Add layover
        </button>
      </div>

      <EditableField
        label="Note"
        multiline
        value={flight.note ?? ""}
        onChange={(v) => update((t) => updateFlight(t, di, fi, "note", v))}
        ariaLabel="Flight note"
        placeholder="Terminal, gate, baggage tips…"
      />

      <ActionBar
        onDelete={() => {
          update((t) => delFlight(t, di, fi));
          onBack();
        }}
      />
    </EditScreenShell>
  );
}
