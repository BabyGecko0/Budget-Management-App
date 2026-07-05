import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import {
  Account,
  Category,
  Summary,
  Transaction,
  TransactionType,
} from "../api/types";
import { useAuth } from "../auth/AuthContext";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const today = () => new Date().toISOString().slice(0, 10);

export default function ExpensesPage() {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  // add-transaction form state
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const loadMonthData = useCallback(async () => {
    const [tx, sum] = await Promise.all([
      api.get<Transaction[]>(`/api/transactions?month=${month}&year=${year}`),
      api.get<Summary>(`/api/reports/summary?month=${month}&year=${year}`),
    ]);
    setTransactions(tx);
    setSummary(sum);
  }, [month, year]);

  useEffect(() => {
    Promise.all([
      api.get<Account[]>("/api/accounts"),
      api.get<Category[]>("/api/categories"),
    ])
      .then(([acc, cats]) => {
        setAccounts(acc);
        setCategories(cats);
        if (acc.length > 0) setAccountId(String(acc[0].id));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load data"));
  }, []);

  useEffect(() => {
    loadMonthData().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load transactions")
    );
  }, [loadMonthData]);

  const formCategories = useMemo(
    () => categories.filter((c) => c.type === (type === "INCOME" ? "INCOME" : "EXPENSE")),
    [categories, type]
  );

  const fmt = (n: number) =>
    `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${user?.currency ?? ""}`;

  const ensureAccount = async (): Promise<string> => {
    if (accountId) return accountId;
    // first transaction ever: create a default cash account transparently
    const acc = await api.post<Account>("/api/accounts", {
      name: "Cash",
      type: "CASH",
      initialBalance: 0,
    });
    setAccounts([acc]);
    setAccountId(String(acc.id));
    return String(acc.id);
  };

  const addTransaction = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const accId = await ensureAccount();
      await api.post<Transaction>("/api/transactions", {
        accountId: Number(accId),
        categoryId: Number(categoryId),
        amount: Number(amount),
        type,
        date,
        note: note || null,
      });
      setAmount("");
      setNote("");
      setDate(today());
      setShowForm(false);
      await loadMonthData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add transaction");
    } finally {
      setBusy(false);
    }
  };

  const removeTransaction = async (id: number) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      await api.del(`/api/transactions/${id}`);
      await loadMonthData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete transaction");
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <>
      <div className="page-title">
        <h1>Expenses</h1>
        <p>Track where your money goes, month by month.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="stat-grid">
        <div className="card">
          <div className="stat-label">Income</div>
          <div className="stat-value income">{fmt(summary?.totalIncome ?? 0)}</div>
        </div>
        <div className="card">
          <div className="stat-label">Expenses</div>
          <div className="stat-value expense">{fmt(summary?.totalExpenses ?? 0)}</div>
        </div>
        <div className="card">
          <div className="stat-label">Net balance</div>
          <div className="stat-value">{fmt(summary?.netBalance ?? 0)}</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="filters">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button className="btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ Add transaction"}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>New transaction</h3>
          <form onSubmit={addTransaction}>
            <div className="form-row">
              <div className="field">
                <label>Type</label>
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value as TransactionType);
                    setCategoryId("");
                  }}
                >
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </select>
              </div>
              <div className="field">
                <label>Amount</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Category</label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="" disabled>Select a category…</option>
                  {formCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon ? `${c.icon} ` : ""}{c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
            {accounts.length > 1 && (
              <div className="field">
                <label>Account</label>
                <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="field">
              <label>Note (optional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. groceries at Spar"
              />
            </div>
            <button className="btn" disabled={busy}>
              {busy ? "Saving…" : "Save transaction"}
            </button>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {transactions.length === 0 ? (
          <div className="empty-state">
            No transactions for {MONTHS[month - 1]} {year} yet.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Note</th>
                <th>Account</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>
                    <span className="cat-chip">
                      {t.categoryIcon ? `${t.categoryIcon} ` : ""}
                      {t.categoryName}
                    </span>
                  </td>
                  <td>{t.note ?? ""}</td>
                  <td>{t.accountName}</td>
                  <td
                    style={{ textAlign: "right" }}
                    className={t.type === "INCOME" ? "amount-income" : "amount-expense"}
                  >
                    {t.type === "INCOME" ? "+" : "−"}{fmt(t.amount)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn danger" onClick={() => removeTransaction(t.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
