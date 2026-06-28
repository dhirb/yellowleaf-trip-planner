import { useState } from "react";
import { LoginScreen } from "./LoginScreen";
import { ForgotPasswordScreen } from "./ForgotPasswordScreen";

/**
 * Unauthenticated admin surface: swaps between the sign-in screen and the
 * standalone password-reset screen. Mirrors the conditional-render idiom the
 * rest of AdminApp uses instead of adding a dedicated router route.
 */
export function AuthScreens() {
  const [view, setView] = useState<"login" | "forgot">("login");

  if (view === "forgot") {
    return <ForgotPasswordScreen onBack={() => setView("login")} />;
  }

  return <LoginScreen onForgotPassword={() => setView("forgot")} />;
}
