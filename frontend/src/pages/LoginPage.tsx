import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { AuthResponse } from "../api/types";
import { useAuth } from "../auth/AuthContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

export default function LoginPage() {
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const googleSlot = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  // Render the official Google button once the GIS script is ready
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    const tryInit = () => {
      if (cancelled) return;
      if (!window.google || !googleSlot.current) {
        setTimeout(tryInit, 200);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          try {
            const auth = await api.post<AuthResponse>("/api/auth/google", {
              idToken: credential,
            });
            signIn(auth);
            navigate("/", { replace: true });
          } catch (e) {
            setError(e instanceof Error ? e.message : "Google sign-in failed");
          }
        },
      });
      window.google.accounts.id.renderButton(googleSlot.current, {
        theme: "outline",
        size: "large",
        width: 316,
        text: "signin_with",
      });
    };

    tryInit();
    return () => {
      cancelled = true;
    };
  }, [signIn, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const auth =
        mode === "login"
          ? await api.post<AuthResponse>("/api/auth/login", { email, password })
          : await api.post<AuthResponse>("/api/auth/register", {
              email,
              password,
              displayName,
            });
      signIn(auth);
      navigate("/", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <div className="brand">💰 Money Budget</div>
        <p className="tagline">Track your money, simply.</p>

        {error && <div className="error-banner">{error}</div>}

        <div className="google-slot" ref={googleSlot}>
          {!GOOGLE_CLIENT_ID && (
            <p className="hint">
              Google sign-in is not configured yet — set VITE_GOOGLE_CLIENT_ID in
              frontend/.env to enable it.
            </p>
          )}
        </div>

        <div className="divider">or continue with email</div>

        <form onSubmit={submit}>
          {mode === "register" && (
            <div className="field">
              <label>Name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="Your name"
              />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
            />
          </div>
          <button className="btn" style={{ width: "100%" }} disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="divider" />
        <p className="hint">
          {mode === "login" ? (
            <>
              No account?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode("register"); setError(null); }}>
                Register
              </a>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode("login"); setError(null); }}>
                Sign in
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
