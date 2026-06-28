import { useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../firebase";
import { AuthContext, type AuthState } from "../hooks/useAuth";

const SIGNED_OUT: AuthState = {
  user: null,
  role: null,
  isAdmin: false,
  loading: false,
};

/** Read the role custom claim from the user's ID token (null if absent/unreadable). */
async function readRole(user: User): Promise<string | null> {
  try {
    const { claims } = await user.getIdTokenResult();
    return typeof claims.role === "string" ? claims.role : null;
  } catch {
    // Treat an unreadable token as "no role" rather than blocking the app.
    return null;
  }
}

/** Tracks the current Firebase user plus its role claim, exposed via context. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    isAdmin: false,
    loading: true,
  });

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (active) setState(SIGNED_OUT);
        return;
      }
      // Resolve the role before clearing `loading` so consumers never see a
      // signed-in user with an undetermined admin status.
      const role = await readRole(user);
      if (active) {
        setState({ user, role, isAdmin: role === "admin", loading: false });
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(() => state, [state]);
  return <AuthContext value={value}>{children}</AuthContext>;
}
