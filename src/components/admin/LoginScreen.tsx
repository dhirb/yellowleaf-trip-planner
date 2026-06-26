import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../../firebase";
import { authErrorMessage } from "../../lib/authErrors";
import { ui } from "../../lib/ui";

type Mode = "signin" | "signup";

/** Admin email/password sign-in and self-serve account creation. */
export function LoginScreen() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    setNotice("");
    if (!email.trim() || !pass.trim()) {
      setError("Enter your email and password to continue.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email.trim(), pass);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), pass);
      }
      // onAuthStateChanged in AuthProvider takes over from here.
    } catch (err: unknown) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setError("");
    setNotice("");
    if (!email.trim()) {
      setError("Enter your email first, then tap reset.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setNotice("Password reset email sent. Check your inbox.");
    } catch (err: unknown) {
      setError(authErrorMessage(err));
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 30px", background: "#FBF8F3" }}>
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: 18,
          background: "#1F1B16",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M5 19V8l7-4 7 4v11" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
          <path d="M9 19v-5h6v5" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
          <path d="M3 19h18" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" }}>Itinerary Studio</div>
      <div style={{ fontSize: 16, color: "#8A8175", fontWeight: 500, marginTop: 4 }}>
        {mode === "signin" ? "Sign in to manage your trips" : "Create an account to start planning"}
      </div>

      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#6B635A", marginBottom: 7 }}>Email</div>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          type="email"
          autoComplete="email"
          style={ui.input}
        />
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#6B635A", marginBottom: 7 }}>Password</div>
        <input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="••••••••"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          style={ui.input}
        />
      </div>

      <div style={{ color: error ? "#C0392B" : "#2F7D5B", fontSize: 14, fontWeight: 600, minHeight: 20, marginTop: 10 }}>
        {error || notice}
      </div>

      <button onClick={submit} disabled={busy} style={{ ...ui.btnPrimary, opacity: busy ? 0.7 : 1 }}>
        {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
            setNotice("");
          }}
          style={{ background: "none", border: "none", color: "#C2541F", fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit", padding: 0 }}
        >
          {mode === "signin" ? "Create an account" : "I already have an account"}
        </button>
        {mode === "signin" && (
          <button
            onClick={resetPassword}
            style={{ background: "none", border: "none", color: "#B0A693", fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit", padding: 0 }}
          >
            Forgot password?
          </button>
        )}
      </div>
    </div>
  );
}
