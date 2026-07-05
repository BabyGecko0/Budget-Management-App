import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { Account, SavingsGoal } from "../api/types";
import MoneyRain from "../components/MoneyRain";
import { useAuth } from "../auth/AuthContext";
import { useConfirm } from "../components/Confirm";
import { money } from "../utils/format";

const RAIN_THRESHOLD = 100;

export default function SavingsPage() {
  const { user } = useAuth();
  const confirmDialog = useConfirm();
  const cur = user?.currency ?? "";

  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [savingsAccounts, setSavingsAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rainKey, setRainKey] = useState(0);

  // new goal form
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  // contribute
  const [contributeTo, setContributeTo] = useState<SavingsGoal | null>(null);
  const [contribution, setContribution] = useState("");

  const load = useCallback(async () => {
    const [g, a] = await Promise.all([
      api.get<SavingsGoal[]>("/api/savings-goals"),
      api.get<Account[]>("/api/accounts"),
    ]);
    setGoals(g);
    setSavingsAccounts(a.filter((x) => x.type === "SAVINGS"));
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load savings"));
  }, [load]);

  const createGoal = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post<SavingsGoal>("/api/savings-goals", {
        name,
        targetAmount: Number(target),
        currentAmount: 0,
        deadline: deadline || null,
        note: note || null,
      });
      setName(""); setTarget(""); setDeadline(""); setNote("");
      setShowNew(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create goal");
    } finally {
      setBusy(false);
    }
  };

  const contribute = async (e: FormEvent) => {
    e.preventDefault();
    if (!contributeTo) return;
    setError(null);
    setBusy(true);
    try {
      const amount = Number(contribution);
      await api.post<SavingsGoal>(
        `/api/savings-goals/${contributeTo.id}/contribute?amount=${amount}`,
        {}
      );
      setContributeTo(null);
      setContribution("");
      await load();
      if (amount >= RAIN_THRESHOLD) {
        setRainKey((k) => k + 1); // 🌧️💵 make it rain
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to contribute");
    } finally {
      setBusy(false);
    }
  };

  const removeGoal = async (id: number) => {
    const ok = await confirmDialog({
      title: "Delete savings goal?",
      message: "Your saved progress on this goal will be lost.",
    });
    if (!ok) return;
    try {
      await api.del(`/api/savings-goals/${id}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete goal");
    }
  };

  const totalSaved =
    goals.reduce((s, g) => s + g.currentAmount, 0) +
    savingsAccounts.reduce((s, a) => s + a.balance, 0);

  const daysLeft = (iso: string | null) => {
    if (!iso) return null;
    return Math.ceil((new Date(iso + "T00:00:00").getTime() - Date.now()) / 86400000);
  };

  return (
    <>
      <MoneyRain burstKey={rainKey} />

      <div className="page-head">
        <div className="page-title">
          <h1>Savings</h1>
          <p>Watch your safety net grow.</p>
        </div>
        <button className="btn" onClick={() => setShowNew((s) => !s)}>
          {showNew ? "Cancel" : "+ New goal"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="stat-grid">
        <div className="card hero-balance anim-in">
          <div className="stat-label">Total saved</div>
          <div className="stat-value">{money(totalSaved, cur)}</div>
          <div className="stat-sub">
            {goals.length} goal{goals.length === 1 ? "" : "s"}
            {savingsAccounts.length > 0 && ` · ${savingsAccounts.length} savings account${savingsAccounts.length === 1 ? "" : "s"}`}
          </div>
        </div>
        {savingsAccounts.map((a) => (
          <div key={a.id} className="card anim-in-1">
            <div className="stat-label">🏦 {a.name}</div>
            <div className="stat-value income">{money(a.balance, cur)}</div>
            <div className="stat-sub">Savings account</div>
          </div>
        ))}
      </div>

      {showNew && (
        <div className="card anim-in" style={{ marginBottom: 20, maxWidth: 560 }}>
          <h3>New savings goal</h3>
          <form onSubmit={createGoal}>
            <div className="form-row">
              <div className="field">
                <label>Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency fund" />
              </div>
              <div className="field">
                <label>Target amount</label>
                <input type="number" min="1" step="0.01" required value={target} onChange={(e) => setTarget(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Deadline (optional)</label>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <div className="field">
                <label>Note (optional)</label>
                <input value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>
            <button className="btn" disabled={busy}>{busy ? "Creating…" : "Create goal"}</button>
          </form>
        </div>
      )}

      {goals.length === 0 && !showNew ? (
        <div className="card">
          <div className="empty-state">
            No savings goals yet. Create one and start stacking 💰
          </div>
        </div>
      ) : (
        <div className="goal-grid">
          {goals.map((g, i) => {
            const pct = Math.min(100, g.progressPercent);
            const done = g.currentAmount >= g.targetAmount;
            const dl = daysLeft(g.deadline);
            return (
              <div key={g.id} className={`card hoverable anim-in-${Math.min(i, 3)}`}>
                <div className="row-between">
                  <h3 style={{ margin: 0 }}>{done ? "🏆 " : "🎯 "}{g.name}</h3>
                  {done ? (
                    <span className="badge green">Reached!</span>
                  ) : dl != null ? (
                    <span className={`badge ${dl < 0 ? "red" : dl < 30 ? "amber" : "gray"}`}>
                      {dl < 0 ? `${-dl}d overdue` : `${dl}d left`}
                    </span>
                  ) : null}
                </div>
                <div className="goal-meta">
                  <span>{money(g.currentAmount, cur)} of {money(g.targetAmount, cur)}</span>
                  <span style={{ fontWeight: 700, color: done ? "var(--green-600)" : undefined }}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                {g.note && <p className="muted" style={{ marginTop: 10, marginBottom: 0 }}>{g.note}</p>}
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button className="btn" onClick={() => { setContributeTo(g); setContribution(""); }}>
                    + Add money
                  </button>
                  <button className="btn danger" onClick={() => removeGoal(g.id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {contributeTo && (
        <div className="modal-backdrop" onClick={() => setContributeTo(null)}>
          <div className="card modal" style={{ width: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 style={{ margin: 0 }}>Add to “{contributeTo.name}”</h3>
              <button className="btn ghost" onClick={() => setContributeTo(null)}>✕</button>
            </div>
            <form onSubmit={contribute}>
              <div className="field">
                <label>Amount</label>
                <input
                  type="number" min="0.01" step="0.01" required autoFocus
                  value={contribution}
                  onChange={(e) => setContribution(e.target.value)}
                />
              </div>
              <p className="hint" style={{ textAlign: "left", marginTop: 0 }}>
                Tip: save {RAIN_THRESHOLD}+ at once and something special happens… 🌧️
              </p>
              <button className="btn" disabled={busy} style={{ width: "100%" }}>
                {busy ? "Saving…" : "Contribute"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
