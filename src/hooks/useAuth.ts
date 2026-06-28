import { createContext, useContext } from "react";
import type { User } from "firebase/auth";

export interface AuthState {
  user: User | null;
  /** Role from the user's custom claims (e.g. "admin"), or null if none. */
  role: string | null;
  /** Convenience flag: true when the signed-in user has the admin role. */
  isAdmin: boolean;
  loading: boolean;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  role: null,
  isAdmin: false,
  loading: true,
});

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
