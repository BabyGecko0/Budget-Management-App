import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import { UserProfile } from "../api/types";
import { useAuth } from "../auth/AuthContext";

export default function ProfilePage() {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [currency, setCurrency] = useState("ALL");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get<UserProfile>("/api/users/me")
      .then((p) => {
        setProfile(p);
        setDisplayName(p.displayName ?? "");
        setCurrency(p.currency ?? "ALL");
        setMonthlyIncome(p.monthlyIncome != null ? String(p.monthlyIncome) : "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load profile"));
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      const updated = await api.put<UserProfile>("/api/users/me", {
        displayName,
        currency,
        monthlyIncome: monthlyIncome === "" ? null : Number(monthlyIncome),
      });
      setProfile(updated);
      updateUser({ displayName: updated.displayName, currency: updated.currency });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save profile");
    } finally {
      setBusy(false);
    }
  };

  if (!profile && !error) {
    return <p>Loading…</p>;
  }

  return (
    <>
      <div className="page-title">
        <h1>Profile</h1>
        <p>Your personal information and monthly income.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {saved && <div className="success-banner">Profile saved.</div>}

      {profile && (
        <div className="card" style={{ maxWidth: 520 }}>
          <form onSubmit={save}>
            <div className="field">
              <label>Email</label>
              <input value={profile.email} disabled />
            </div>
            <div className="field">
              <label>Sign-in method</label>
              <input value={profile.authProvider === "GOOGLE" ? "Google" : "Email & password"} disabled />
            </div>
            <div className="field">
              <label>Display name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="form-row">
              <div className="field">
                <label>Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="ALL">ALL — Albanian Lek</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="GBP">GBP — British Pound</option>
                </select>
              </div>
              <div className="field">
                <label>Monthly income</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="e.g. 120000"
                />
              </div>
            </div>
            <button className="btn" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
