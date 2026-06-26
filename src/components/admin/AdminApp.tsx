import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { useAuth } from "../../hooks/useAuth";
import { AuthProvider } from "../AuthProvider";
import { useTrips } from "../../hooks/useTrips";
import { useToast } from "../../hooks/useToast";
import { createTrip } from "../../lib/trips";
import { authErrorMessage } from "../../lib/authErrors";
import { Toast } from "../Toast";
import { LoginScreen } from "./LoginScreen";
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
  const { user, loading } = useAuth();
  const { trips, loading: tripsLoading } = useTrips(user?.uid);
  const { toast, showToast } = useToast();
  const [editId, setEditId] = useState<string | null>(null);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#A89F92", fontWeight: 600, background: "#FBF8F3" }}>
        Loading…
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const newTrip = async () => {
    try {
      const id = await createTrip(user.uid);
      setEditId(id);
    } catch (e: unknown) {
      showToast(authErrorMessage(e));
    }
  };

  return (
    <>
      {editId ? (
        <Editor tripId={editId} onBack={() => setEditId(null)} onPreview={(id) => navigate(`/t/${id}`)} showToast={showToast} />
      ) : (
        <TripsList trips={trips} loading={tripsLoading} onOpen={(id) => setEditId(id)} onNew={newTrip} onSignOut={() => signOut(auth)} />
      )}
      <Toast message={toast} />
    </>
  );
}
