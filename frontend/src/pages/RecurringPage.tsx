import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import {
  Account,
  Category,
  Frequency,
  RecurringTransaction,
  TransactionType,
} from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { useConfirm } from "../components/Confirm";
import { money, today } from "../utils/format";

export default function RecurringPage() {
  const { user } = useAuth();
  const confirmDialog = useConfirm();
  const cur = user?.currency ?? "";

  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showNew, setShowNew] = useState(false);
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("MONTHLY");
  const [startDate, setStartDate] = useState(today());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setItems(await api.get<RecurringTransaction[]>("/api/recurring-transactions"));
  }, []);

  useEffect(() => {
    Promise.all([
      load(),
      api.get<Account[]>("/api/accounts").then(setAccounts),
      api.get<Category[]>("/api/categories").then(setCategories),
    ]).catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [load]);

  const formCategories = useMemo(
    () => categories.filter((c) => c.type === (type === "INCOME" ? "INCOME" : "EXPENSE")),
    [categories, type]
  );

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post<RecurringTransaction>("/api/recurring-transactions", {
        accountId: Number(accountId || accounts[0]?.id),
        categoryId: Number(categoryId),
        amount: Number(amount),
        type,
        frequency,
        startDate,
        note: note || null,
      });
      setAmount(""); setNote(""); setCategoryId("");
      setShowNew(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (id: number) => {
    try {
      await api.post<RecurringTransaction>(`/api/recurring-transactions/${id}/toggle`, {});
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to toggle");
    }
  };

  const remove = async (id: number) => {
    const ok = await confirmDialog({
      title: "Delete recurring transaction?",
      message: "Future automatic entries will stop. Past transactions stay.",
    });
    if (!ok) return;
    try {
      await api.del(`/api/recurring-transactions/${id}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const freqLabel: Record<Frequency, string> = {
    DAILY: "Daily",
    WEEKLY: "Weekly",
    MONTHLY: "Monthly",
  };

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Recurring</h1>
          <p>Rent, salary, subscriptions — entered once, tracked forever.</p>
        </div>
        <button className="btn" onClick={() => setShowNew((s) => !s)} disabled={accounts.length === 0}>
          {showNew ? "Cancel" : "+ New recurring"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {accounts.length === 0 && (
        <div className="warn-banner">Create an account first (Accounts page) to add recurring transactions.</div>
      )}

      {showNew && (
        <div className="card anim-in" style={{ marginBottom: 20, maxWidth: 640 }}>
          <h3>New recurring transaction</h3>
          <form onSubmit={create}>
            <div className="form-row-3">
              <div className="field">
                <label>Type</label>
                <select value={type} onChange={(e) => { setType(e.target.value as TransactionType); setCategoryId(""); }}>
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </select>
              </div>
              <div className="field">
                <label>Amount</label>
                <input type="number" min="0.01" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="field">
                <label>Frequency</label>
                <select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
                  <option value="MONTHLY">Monthly</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="DAILY">Daily</option>
                </select>
              </div>
            </div>
            <div className="form-row-3">
              <div className="field">
                <label>Category</label>
                <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="" disabled>Select…</option>
                  {formCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ""}{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>First run</label>
                <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="field">
                <label>Account</label>
                <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Note (optional)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Netflix subscription" />
            </div>
            <button className="btn" disabled={busy}>{busy ? "Creating…" : "Create"}</button>
          </form>
        </div>
      )}

      {items.length === 0 && !showNew ? (
        <div className="card">
          <div className="empty-state">Nothing recurring yet. Add your rent or salary so it books itself.</div>
        </div>
      ) : (
        <div className="list-plain">
          {items.map((r) => (
            <div key={r.id} className="tx-row" style={{ opacity: r.active ? 1 : 0.55 }}>
              <div className="tx-icon" style={{ background: r.type === "INCOME" ? "var(--green-500)" : "var(--red-400)" }}>
                {r.type === "INCOME" ? "↓" : "↑"}
              </div>
              <div className="tx-info">
                <div className="tx-cat">{r.categoryName}{r.note ? ` — ${r.note}` : ""}</div>
                <div className="tx-note">
                  {freqLabel[r.frequency]} · next on {r.nextRunDate} · {r.accountName}
                </div>
              </div>
              <span className={`badge ${r.active ? "green" : "gray"}`}>{r.active ? "Active" : "Paused"}</span>
              <div className={`tx-amount ${r.type === "INCOME" ? "income" : "expense"}`}>
                {r.type === "INCOME" ? "+" : "−"}{money(r.amount, cur)}
              </div>
              <div className="tx-actions">
                <button className="btn ghost" onClick={() => toggle(r.id)}>
                  {r.active ? "Pause" : "Resume"}
                </button>
                <button className="btn danger" onClick={() => remove(r.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
