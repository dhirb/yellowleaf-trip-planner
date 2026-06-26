import { useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { AuthContext, type AuthState } from "../hooks/useAuth";

/** Tracks the current Firebase user and exposes it via context. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => setState({ user, loading: false }));
  }, []);

  const value = useMemo(() => state, [state]);
  return <AuthContext value={value}>{children}</AuthContext>;
}
