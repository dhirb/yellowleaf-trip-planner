import { cn } from "../../lib/cn";
import { ui } from "../../lib/ui";
import { BedDouble } from "lucide-react";

interface StayCardProps {
  name: string;
  sub: string;
  /** When provided the card becomes a tappable button (admin edit). */
  onOpen?: () => void;
}

const BASE = cn(ui.padCard, "mt-[18px] flex items-center gap-[14px]");

/**
 * The "where you're staying" accommodation card. Shared by the traveler day
 * view (static `div`) and the admin day editor (tappable `button` via
 * `onOpen`).
 */
export function StayCard({ name, sub, onOpen }: StayCardProps) {
  const inner = (
    <>
      <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-md bg-stay">
        <BedDouble size={22} color="#fff" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-tag font-extrabold uppercase tracking-[0.6px] text-faint">
          Where you're staying
        </div>
        <div className="mt-[2px] text-lead font-bold">{name}</div>
        <div className="mt-px text-small font-medium text-muted">{sub}</div>
      </div>
    </>
  );

  if (onOpen) {
    return (
      <button onClick={onOpen} className={cn(BASE, "w-full text-left")}>
        {inner}
      </button>
    );
  }
  return <div className={BASE}>{inner}</div>;
}
