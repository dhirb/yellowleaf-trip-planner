import type { Trip } from "../../types";
import { ui } from "../../lib/ui";
import { Button } from "../ui/Button";
import { CloseIcon, PlusIcon } from "../../lib/icons";
import { CONTACT_COLOR } from "../../lib/ui";
import {
  addContact,
  delContact,
  setTripEnd,
  setTripField,
  setTripStart,
  toggleVisibility,
  updateContact,
} from "../../lib/editTrip";

interface SettingsTabProps {
  trip: Trip;
  update: (updater: (t: Trip) => Trip) => void;
  set: (next: Trip) => void;
  onPublish: () => void;
  onPreview: () => void;
  onToast: (msg: string) => void;
}

const Label = ({ children, mt = 0 }: { children: string; mt?: number }) => (
  <div style={{ fontSize: 12, fontWeight: 800, color: "#A89F92", letterSpacing: "0.6px", textTransform: "uppercase", margin: `${mt}px 0 10px` }}>
    {children}
  </div>
);

const contactInput = {
  height: 40,
  borderRadius: 10,
  border: "1px solid #E2DACC",
  padding: "0 10px",
  fontSize: 14,
  color: "#1F1B16",
  boxSizing: "border-box",
  outline: "none",
  background: "#fff",
  fontFamily: "inherit",
} as const;

export function SettingsTab({ trip, update, set, onPublish, onPreview, onToast }: SettingsTabProps) {
  const start = trip.days[0].date;
  const end = trip.days[trip.days.length - 1].date;
  const shareLink = `${window.location.origin}/t/${trip.id}`;

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
      <div style={{ ...ui.padCard, marginBottom: 16 }}>
        <Label>Trip name</Label>
        <input value={trip.title} onChange={(e) => update((t) => setTripField(t, "title", e.target.value))} style={{ ...ui.input, fontWeight: 700 }} />
        <Label mt={18}>Trip dates</Label>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6B635A", marginBottom: 5 }}>Start</div>
            <input type="date" value={start} onChange={(e) => set(setTripStart(trip, e.target.value))} style={{ ...ui.input, height: 48, fontWeight: 600 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6B635A", marginBottom: 5 }}>End</div>
            <input
              type="date"
              value={end}
              min={start}
              onChange={(e) => {
                const next = setTripEnd(trip, e.target.value);
                if (next) set(next);
                else onToast("End date must be on or after the start.");
              }}
              style={{ ...ui.input, height: 48, fontWeight: 600 }}
            />
          </div>
        </div>
      </div>

      {/* Visibility */}
      <div style={{ ...ui.padCard, marginBottom: 16 }}>
        <Label>Who can view this trip</Label>
        <button
          onClick={() => update(toggleVisibility)}
          style={{ display: "flex", alignItems: "center", gap: 13, cursor: "pointer", width: "100%", textAlign: "left", background: "none", border: "none", padding: 0, fontFamily: "inherit" }}
        >
          <div style={{ width: 52, height: 32, borderRadius: 999, flexShrink: 0, background: trip.visibility === "public" ? "#2F7D5B" : "#D9CFBE", position: "relative", transition: "background .2s" }}>
            <div style={{ position: "absolute", top: 3, left: trip.visibility === "public" ? 23 : 3, width: 26, height: 26, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 5px rgba(0,0,0,0.2)", transition: "left .2s" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16.5, fontWeight: 700 }}>
              {trip.visibility === "public" ? "Public — anyone with the link" : "Private — code required"}
            </div>
            <div style={{ fontSize: 13.5, color: "#8A8175", fontWeight: 500, marginTop: 1, lineHeight: 1.4 }}>
              {trip.visibility === "public"
                ? "Travelers open the link directly. No code needed."
                : "Travelers must enter the access code below to view."}
            </div>
          </div>
        </button>
        {trip.visibility === "private" && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#6B635A", marginBottom: 7 }}>Access code</div>
            <input value={trip.password} onChange={(e) => update((t) => setTripField(t, "password", e.target.value))} style={{ ...ui.input, fontWeight: 700, letterSpacing: "0.5px" }} />
          </div>
        )}
      </div>

      {/* Share link */}
      <div style={{ ...ui.padCard, marginBottom: 16 }}>
        <Label>Share link</Label>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0, height: 50, borderRadius: 13, background: "#F6F1E9", border: "1px solid #ECE4D8", display: "flex", alignItems: "center", padding: "0 14px", fontSize: 15, fontWeight: 700, color: "#6B635A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {shareLink}
          </div>
          <button onClick={copyLink} style={{ height: 50, padding: "0 18px", borderRadius: 13, background: "#1F1B16", color: "#fff", fontSize: 14.5, fontWeight: 800, display: "flex", alignItems: "center", cursor: "pointer", flexShrink: 0, border: "none", fontFamily: "inherit" }}>
            Copy
          </button>
        </div>
      </div>

      {/* Contacts */}
      <div style={{ ...ui.padCard, marginBottom: 16 }}>
        <Label>Important contacts</Label>
        {trip.contacts.map((c, ci) => (
          <div key={ci} style={{ background: "#F8F4ED", border: "1px solid #ECE4D8", borderRadius: 14, padding: 10, marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <div style={{ width: 13, height: 13, borderRadius: "50%", flexShrink: 0, background: CONTACT_COLOR[c.kind] ?? "#8A8175" }} />
              <input value={c.label} onChange={(e) => update((t) => updateContact(t, ci, "label", e.target.value))} placeholder="Name" style={{ ...contactInput, flex: 1, minWidth: 0, fontWeight: 700 }} />
              <button onClick={() => update((t) => delContact(t, ci))} aria-label="Remove contact" style={{ width: 34, height: 34, borderRadius: 9, background: "#FBEEEC", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, border: "none" }}>
                <CloseIcon size={15} />
              </button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={c.value} onChange={(e) => update((t) => updateContact(t, ci, "value", e.target.value))} placeholder="Phone number" style={{ ...contactInput, flex: 1, minWidth: 0, fontWeight: 600 }} />
              <select
                value={c.kind}
                onChange={(e) => update((t) => updateContact(t, ci, "kind", e.target.value))}
                style={{ ...contactInput, width: 120, flexShrink: 0, padding: "0 8px", fontSize: 13.5, fontWeight: 700, appearance: "none", WebkitAppearance: "none" }}
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
        <button onClick={() => update(addContact)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 44, width: "100%", borderRadius: 12, border: "1.5px dashed #D9CFBE", color: "#8A8175", fontSize: 14, fontWeight: 700, cursor: "pointer", background: "none", fontFamily: "inherit" }}>
          <PlusIcon size={16} />
          Add contact
        </button>
      </div>

      <Button onClick={onPublish} style={{ marginBottom: 12 }}>
        Publish changes
      </Button>
      <Button variant="ghost" onClick={onPreview}>
        Preview as traveler
      </Button>
    </>
  );
}
