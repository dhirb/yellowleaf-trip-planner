import type { Trip } from "../../types";
import { ui, contactColor } from "../../lib/ui";
import { cn } from "../../lib/cn";

interface HelpScreenProps {
  trip: Trip;
}

const Label = ({ children }: { children: string }) => (
  <div className="mb-[10px] text-tag font-extrabold uppercase tracking-[0.6px] text-faint">
    {children}
  </div>
);

/** Quick-reference screen: who to call and how to say the basics. */
export function HelpScreen({ trip }: HelpScreenProps) {
  return (
    <>
      <div className="shrink-0 px-[18px] pt-[max(env(safe-area-inset-top),14px)] pb-[12px]">
        <div className="text-display font-extrabold tracking-[-0.5px]">Help</div>
        <div className="mt-[3px] text-body font-medium text-muted">
          Contacts & useful phrases
        </div>
      </div>
      <div className="no-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-[18px] pt-1 pb-[26px]">
        {/* Contacts */}
        {trip.contacts.length > 0 && (
          <div className={cn(ui.padCard, "mb-4")}>
            <Label>Important contacts</Label>
            {trip.contacts.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-[13px] px-0 py-[9px]"
              >
                <div
                  className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[12px] text-lead font-extrabold text-white"
                  style={{ background: contactColor(c) }}
                >
                  {c.label[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-body font-bold">{c.label}</div>
                  <div className="text-small font-semibold text-muted">
                    {c.value}
                  </div>
                </div>
                <a
                  href={`tel:${c.value.replace(/[^0-9+]/g, "")}`}
                  className="rounded-[12px] bg-control px-4 py-[9px] text-small font-extrabold text-accent no-underline"
                >
                  Call
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Phrases */}
        {trip.phrases.length > 0 && (
          <div className={ui.padCard}>
            <Label>Useful phrases</Label>
            {trip.phrases.map((ph, i) => (
              <div
                key={i}
                className={cn(
                  "px-0 py-2",
                  i === trip.phrases.length - 1
                    ? "border-b-0"
                    : "border-b border-control",
                )}
              >
                <div className="text-body font-semibold text-muted">
                  {ph.en}
                </div>
                <div className="mt-px text-lead font-bold">{ph.local}</div>
                <div className="text-caption font-semibold italic text-fainter">
                  {ph.pron}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
