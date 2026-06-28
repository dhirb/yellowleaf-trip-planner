import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { useAuth } from "../../hooks/useAuth";
import { AuthProvider } from "../AuthProvider";
import { useTrips } from "../../hooks/useTrips";
import { useToast } from "../../hooks/useToast";
import { newTripRef } from "../../lib/trips";
import { authErrorMessage } from "../../lib/authErrors";
import { Toast } from "../Toast";
import { AuthScreens } from "./AuthScreens";
import { NotAuthorized } from "./NotAuthorized";
import { TripsList } from "./TripsList";
import { Editor } from "./Editor";

/** Admin persona: auth gate → trips list → trip editor. */
export function AdminApp() {
  return (
    <AuthProvider>
      <AdminInner />
    </AuthProvider>
  );
}

function AdminInner() {
  const { user, isAdmin, loading } = useAuth();
  const { trips, loading: tripsLoading } = useTrips(
    user?.uid,
    user?.email?.toLowerCase() ?? null,
  );
  const { toast, showToast } = useToast();
  const [editId, setEditId] = useState<string | null>(null);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-app-bg font-semibold text-faint">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <AuthScreens />;
  }

  if (!isAdmin) {
    return <NotAuthorized email={user.email} onSignOut={() => signOut(auth)} />;
  }

  const newTrip = () => {
    // Navigate to the editor instantly; the document id is generated locally and
    // the write settles in the background (the editor loads it from cache).
    const { id, created } = newTripRef(user.uid);
    setEditId(id);
    created.catch((e: unknown) => {
      showToast(authErrorMessage(e));
      // Back out of the editor if the trip never actually persisted.
      setEditId((current) => (current === id ? null : current));
    });
  };

  return (
    <>
      {editId ? (
        <Editor
          tripId={editId}
          onBack={() => setEditId(null)}
          onPreview={(id) => navigate(`/t/${id}`)}
          showToast={showToast}
          onDeleted={() => setEditId(null)}
        />
      ) : (
        <TripsList
          trips={trips}
          loading={tripsLoading}
          onOpen={(id) => setEditId(id)}
          onNew={newTrip}
          onSignOut={() => signOut(auth)}
          userEmail={user.email}
          userName={user.displayName}
          userPhotoURL={user.photoURL}
        />
      )}
      <Toast message={toast} />
    </>
  );
}
