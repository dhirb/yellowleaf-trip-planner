import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase";
import { authErrorMessage } from "../../lib/authErrors";
import { cn } from "../../lib/cn";
import { ui } from "../../lib/ui";

interface ForgotPasswordScreenProps {
  /** Return to the sign-in screen. */
  onBack: () => void;
}

/**
 * Standalone password-reset screen. Reached from the login screen's
 * "Forgot password?" link — the email is entered here, so no email is
 * required on the login screen beforehand.
 */
export function ForgotPasswordScreen({ onBack }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    setNotice("");
    if (!email.trim()) {
      setError("Enter your email to receive a reset link.");
      return;
    }
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setNotice("Password reset email sent. Check your inbox.");
    } catch (err: unknown) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col justify-center bg-app-bg px-[30px] py-10">
      <button
        onClick={onBack}
        className="mb-6 flex cursor-pointer items-center gap-[6px] self-start bg-transparent p-0 text-[14px] font-bold text-muted"
      >
        <ArrowLeft size={18} strokeWidth={2.2} />
        Back to sign in
      </button>

      <div className="text-[28px] font-extrabold tracking-[-0.5px]">
        Reset password
      </div>
      <div className="mt-1 text-[16px] font-medium text-muted">
        Enter your email and we'll send you a reset link
      </div>

      <div className="mt-7">
        <div className="mb-[7px] text-[13px] font-bold text-ink-dim">Email</div>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="you@email.com"
          type="email"
          autoComplete="email"
          className={ui.input}
        />
      </div>

      <div
        className={cn(
          "mt-[10px] min-h-[20px] text-[14px] font-semibold",
          error ? "text-danger" : "text-meal",
        )}
      >
        {error || notice}
      </div>

      <button
        onClick={submit}
        disabled={busy}
        className={cn(ui.btnPrimary, busy ? "opacity-70" : "opacity-100")}
      >
        {busy ? "Please wait…" : "Send reset link"}
      </button>
    </div>
  );
}
