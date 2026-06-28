import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import { authErrorMessage } from "../../lib/authErrors";
import { cn } from "../../lib/cn";
import { ui } from "../../lib/ui";

interface LoginScreenProps {
  /** Navigate to the standalone password-reset screen. */
  onForgotPassword: () => void;
}

/**
 * Admin email/password sign-in. Accounts are created out-of-band by the
 * provisioning script (`npm run provision`), not self-serve, so there is no
 * sign-up flow here.
 */
export function LoginScreen({ onForgotPassword }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    if (!email.trim() || !pass.trim()) {
      setError("Enter your email and password to continue.");
      return;
    }
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      // onAuthStateChanged in AuthProvider takes over from here.
    } catch (err: unknown) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col justify-center bg-app-bg px-[30px] py-10">
      <div className="mb-6 self-center">
        {/* Yellowleaf brand mark — kept in sync with public/favicon.svg */}
        <svg
          width="60"
          height="60"
          viewBox="0 0 64 64"
          role="img"
          aria-label="Yellowleaf"
        >
          <rect width="64" height="64" rx="16" fill="#C2541F" />
          <path
            d="M44 16c-14 0-26 9-26 24 0 3 .7 6 1.9 8.5C24 38 31 31 41 27c-8 5.5-14 13-16.5 22.4C38 51 48 41 48 26c0-4-1.4-7.4-4-10z"
            fill="#F3EDE2"
          />
          <path
            d="M20 50C24 36 33 28 44 24"
            stroke="#C2541F"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="text-[16px] font-medium text-muted">
        Sign in to manage your trips
      </div>

      <div className="mt-7">
        <div className="mb-[7px] text-[13px] font-bold text-ink-dim">Email</div>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          type="email"
          autoComplete="email"
          className={ui.input}
        />
      </div>
      <div className="mt-4">
        <div className="mb-[7px] text-[13px] font-bold text-ink-dim">
          Password
        </div>
        <input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="••••••••"
          autoComplete="current-password"
          className={ui.input}
        />
      </div>

      <div className="mt-[10px] min-h-5 text-[14px] font-semibold text-danger">
        {error}
      </div>

      <button
        onClick={submit}
        disabled={busy}
        className={cn(ui.btnPrimary, busy ? "opacity-70" : "opacity-100")}
      >
        {busy ? "Please wait…" : "Sign in"}
      </button>

      <div className="mt-[18px] flex justify-end">
        <button
          onClick={onForgotPassword}
          className="cursor-pointer bg-transparent p-0 text-[13.5px] font-bold text-fainter"
        >
          Forgot password?
        </button>
      </div>
    </div>
  );
}
