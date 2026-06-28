import { BedDouble, MapPin, Phone } from "lucide-react";
import type { Stay } from "../../types";
import { DetailShell } from "./DetailShell";

const mapsHref = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

/**
 * Full-page accommodation detail, opened by tapping the stay card. Surfaces the
 * fields the compact card hides — address (opens maps), phone (tap to call),
 * and the booking note. The `stay` is expected to be already localized.
 */
export function StayDetailScreen({
  stay,
  onBack,
}: {
  stay: Stay;
  onBack: () => void;
}) {
  const address = stay.address?.trim();
  const phone = stay.phone?.trim();

  return (
    <DetailShell title="Where you're staying" onBack={onBack}>
      <div className="mb-4 flex h-[58px] w-[58px] items-center justify-center rounded-lg bg-stay">
        <BedDouble size={28} color="#fff" strokeWidth={2} />
      </div>

      <div className="mt-[2px] mb-1.5 text-display font-extrabold tracking-[-0.4px] [text-wrap:pretty]">
        {stay.name}
      </div>
      {stay.desc && (
        <div className="text-body font-semibold text-muted [text-wrap:pretty]">
          {stay.desc}
        </div>
      )}

      {(address || phone) && (
        <div className="mt-[18px] flex flex-col gap-2">
          {address && (
            <a
              href={mapsHref(address)}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-3 rounded-md border border-border bg-surface px-4 py-3 text-left"
            >
              <MapPin
                size={20}
                color="#7A6F60"
                strokeWidth={2}
                className="mt-px shrink-0"
              />
              <span className="min-w-0 flex-1 text-body font-semibold text-ink [text-wrap:pretty]">
                {address}
              </span>
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-left"
            >
              <Phone
                size={20}
                color="#7A6F60"
                strokeWidth={2}
                className="shrink-0"
              />
              <span className="min-w-0 flex-1 text-body font-semibold text-ink">
                {phone}
              </span>
            </a>
          )}
        </div>
      )}

      {stay.note && (
        <div className="mt-4 text-lead font-medium leading-[1.5] text-ink-soft [text-wrap:pretty]">
          {stay.note}
        </div>
      )}
    </DetailShell>
  );
}
