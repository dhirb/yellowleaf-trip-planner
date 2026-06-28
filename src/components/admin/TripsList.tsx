import type { Trip } from "../../types";
import { rangeLabel } from "../../lib/date";
import { cn } from "../../lib/cn";
import { ui } from "../../lib/ui";
import { ChevronRight } from "lucide-react";
import { AddRow } from "../ui/AddRow";
import { AccountMenu } from "./AccountMenu";

interface TripsListProps {
  trips: Trip[];
  loading: boolean;
  onOpen: (id: string) => void;
  onNew: () => void;
  onSignOut: () => void;
  userEmail: string | null;
  userName: string | null;
  userPhotoURL: string | null;
}

function statusOf(tr: Trip): { label: string; color: string; bg: string } {
  if (!tr.published) return { label: "Draft", color: "#B5830F", bg: "#FBF1D9" };
  return { label: "Live · Shared", color: "#2F7D5B", bg: "#DEF0E6" };
}

export function TripsList({
  trips,
  loading,
  onOpen,
  onNew,
  onSignOut,
  userEmail,
  userName,
  userPhotoURL,
}: TripsListProps) {
  return (
    <div className="flex h-full flex-col bg-app-bg">
      <div className="flex shrink-0 items-center justify-between px-[18px] pt-[max(env(safe-area-inset-top),14px)] pb-[14px]">
        <div>
          <div className="text-[27px] font-extrabold tracking-[-0.5px]">
            Your trips
          </div>
        </div>
        <AccountMenu
          email={userEmail}
          name={userName}
          photoURL={userPhotoURL}
          onSignOut={onSignOut}
        />
      </div>

      <div
        className={cn(
          "no-scrollbar",
          "min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-[18px] pt-[6px] pb-[26px]",
        )}
      >
        {loading && (
          <div className="px-1 py-5 font-semibold text-faint">
            Loading your trips…
          </div>
        )}

        {!loading && trips.length === 0 && (
          <div className={cn(ui.padCard, "text-center")}>
            <div className="text-[17px] font-bold">No trips yet</div>
            <div className="mt-[6px] text-[14.5px] font-medium leading-[1.4] text-muted">
              Tap Add trip below to create your first itinerary.
            </div>
          </div>
        )}

        {trips.map((tr) => {
          const st = statusOf(tr);
          return (
            <button
              key={tr.id}
              onClick={() => onOpen(tr.id)}
              className={cn(
                ui.padCard,
                "mb-[14px] flex w-full cursor-pointer items-center gap-[14px] text-left",
              )}
            >
              <div
                className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-md text-[22px] font-extrabold text-white"
                style={{ background: tr.cover }}
              >
                {(tr.dest || "?")[0]}
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className="rounded-pill px-[11px] py-1 text-[12px] font-bold"
                  style={{ color: st.color, background: st.bg }}
                >
                  {st.label}
                </span>
                <div className="mt-[5px] mb-[2px] text-[18px] font-bold tracking-[-0.2px]">
                  {tr.title}
                </div>
                <div className="text-[14px] font-semibold text-muted">
                  {tr.dest}
                  {tr.country ? `, ${tr.country}` : ""} ·{" "}
                  {rangeLabel(
                    tr.days[0].date,
                    tr.days[tr.days.length - 1].date,
                  )}
                </div>
              </div>
              <ChevronRight size={18} color="#CFC6B5" strokeWidth={2.4} />
            </button>
          );
        })}

        {!loading && (
          <div className="mt-[2px]">
            <AddRow label="Add trip" color="#C2541F" onClick={onNew} />
          </div>
        )}
      </div>
    </div>
  );
}
