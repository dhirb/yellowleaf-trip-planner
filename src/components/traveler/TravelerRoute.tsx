import { useParams } from "react-router-dom";
import { useTrip } from "../../hooks/useTrip";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { TravelerApp } from "./TravelerApp";

const Centered = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-full flex-col items-center justify-center gap-2 bg-app-bg px-[30px] py-10 text-center">
    {children}
  </div>
);

/** Loads a single trip by URL param and hands it to the traveler experience. */
export function TravelerRoute() {
  const { tripId } = useParams<{ tripId: string }>();
  const { trip, loading, error } = useTrip(tripId);
  const online = useOnlineStatus();

  if (loading) {
    // When offline with nothing cached, the Firestore listener never fires, so
    // the spinner would hang forever. Surface a calm offline message instead —
    // a previously-opened trip still loads from cache and clears `loading`
    // before we ever reach here.
    if (!online) {
      return (
        <Centered>
          <div className="text-[22px] font-extrabold">You're offline</div>
          <div className="text-[15px] font-medium leading-[1.4] text-muted">
            If you've opened this trip on this device before, it'll appear in a
            moment. Otherwise, reconnect to load it.
          </div>
        </Centered>
      );
    }
    return (
      <Centered>
        <div className="font-semibold text-faint">Loading your trip…</div>
      </Centered>
    );
  }

  if (!trip) {
    return (
      <Centered>
        <div className="text-[22px] font-extrabold">Trip not available</div>
        <div className="text-[15px] font-medium leading-[1.4] text-muted">
          {error
            ? "This trip is private or hasn't been published yet."
            : "We couldn't find a trip at this link."}
        </div>
      </Centered>
    );
  }

  return <TravelerApp trip={trip} />;
}
