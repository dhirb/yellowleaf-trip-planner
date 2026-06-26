import { useParams } from "react-router-dom";
import { useTrip } from "../../hooks/useTrip";
import { TravelerApp } from "./TravelerApp";

const Centered = ({ children }: { children: React.ReactNode }) => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "40px 30px", textAlign: "center", background: "#FBF8F3" }}>
    {children}
  </div>
);

/** Loads a single trip by URL param and hands it to the traveler experience. */
export function TravelerRoute() {
  const { tripId } = useParams<{ tripId: string }>();
  const { trip, loading, error } = useTrip(tripId);

  if (loading) {
    return <Centered><div style={{ color: "#A89F92", fontWeight: 600 }}>Loading your trip…</div></Centered>;
  }

  if (!trip) {
    return (
      <Centered>
        <div style={{ fontSize: 22, fontWeight: 800 }}>Trip not available</div>
        <div style={{ fontSize: 15, color: "#8A8175", fontWeight: 500, lineHeight: 1.4 }}>
          {error ? "This trip is private or hasn't been published yet." : "We couldn't find a trip at this link."}
        </div>
      </Centered>
    );
  }

  return <TravelerApp trip={trip} />;
}
