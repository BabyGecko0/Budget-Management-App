import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { Budget, Category } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { useConfirm } from "../components/Confirm";
import { MONTHS, money } from "../utils/format";

export default function BudgetsPage() {
  const { user } = useAuth();
  const confirmDialog = useConfirm();
  const cur = user?.currency ?? "";
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showNew, setShowNew] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [limit, setLimit] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const b = await api.get<Budget[]>(`/api/budgets?month=${month}&year=${year}`);
    setBudgets(b);
  }, [month, year]);

  useEffect(() => {
    api.get<Category[]>("/api/categories")
      .then((c) => setCategories(c.filter((x) => x.type === "EXPENSE")))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load categories"));
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load budgets"));
  }, [load]);

  const availableCategories = useMemo(
    () => categories.filter((c) => !budgets.some((b) => b.categoryId === c.id)),
    [categories, budgets]
  );

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post<Budget>("/api/budgets", {
        categoryId: Number(categoryId),
        monthlyLimit: Number(limit),
        month,
        year,
      });
      setCategoryId("");
      setLimit("");
      setShowNew(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create budget");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    const ok = await confirmDialog({
      title: "Delete budget?",
      message: "You'll stop tracking a limit for this category this month.",
    });
    if (!ok) return;
    try {
      await api.del(`/api/budgets/${id}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete budget");
    }
  };

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - 1 + i);
  const totalLimit = budgets.reduce((s, b) => s + b.monthlyLimit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Budgets</h1>
          <p>Set monthly limits per category and stay on track.</p>
        </div>
        <button className="btn" onClick={() => setShowNew((s) => !s)}>
          {showNew ? "Cancel" : "+ New budget"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="toolbar">
        <div className="filters">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {budgets.length > 0 && (
          <span className="muted">
            {money(totalSpent, cur)} spent of {money(totalLimit, cur)} budgeted
          </span>
        )}
      </div>

      {showNew && (
        <div className="card anim-in" style={{ marginBottom: 20, maxWidth: 520 }}>
          <h3>New budget for {MONTHS[month - 1]} {year}</h3>
          <form onSubmit={create}>
            <div className="form-row">
              <div className="field">
                <label>Category</label>
                <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="" disabled>Select…</option>
                  {availableCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ""}{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Monthly limit</label>
                <input type="number" min="1" step="0.01" required value={limit} onChange={(e) => setLimit(e.target.value)} />
              </div>
            </div>
            <button className="btn" disabled={busy}>{busy ? "Creating…" : "Create budget"}</button>
          </form>
        </div>
      )}

      {budgets.length === 0 && !showNew ? (
        <div className="card">
          <div className="empty-state">No budgets for {MONTHS[month - 1]} {year}. Set your first limit!</div>
        </div>
      ) : (
        <div className="budget-grid">
          {budgets.map((b, i) => {
            const pct = Math.min(100, (b.spent / b.monthlyLimit) * 100);
            const remaining = b.monthlyLimit - b.spent;
            return (
              <div key={b.id} className={`card hoverable anim-in-${Math.min(i, 3)}`}>
                <div className="row-between">
                  <h3 style={{ margin: 0 }}>
                    {b.categoryIcon ? `${b.categoryIcon} ` : ""}{b.categoryName}
                  </h3>
                  {b.overspent ? (
                    <span className="badge red">Over budget</span>
                  ) : pct > 80 ? (
                    <span className="badge amber">Almost there</span>
                  ) : (
                    <span className="badge green">On track</span>
                  )}
                </div>
                <div className="goal-meta">
                  <span>{money(b.spent, cur)} of {money(b.monthlyLimit, cur)}</span>
                  <span style={{ fontWeight: 700, color: b.overspent ? "var(--red-600)" : "var(--green-600)" }}>
                    {b.overspent
                      ? `${money(-remaining, cur)} over`
                      : `${money(remaining, cur)} left`}
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className={`progress-fill ${b.overspent ? "over" : pct > 80 ? "warn" : ""}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div style={{ marginTop: 14 }}>
                  <button className="btn danger" onClick={() => remove(b.id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
