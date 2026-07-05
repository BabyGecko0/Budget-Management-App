import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client";
import { Account, Category, Transaction, TransactionType } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { useConfirm } from "../components/Confirm";
import { MONTHS, categoryColor, money, prettyDate, today } from "../utils/format";

interface TxForm {
  id: number | null;
  type: TransactionType;
  amount: string;
  categoryId: string;
  accountId: string;
  date: string;
  note: string;
}

const emptyForm = (accountId = ""): TxForm => ({
  id: null,
  type: "EXPENSE",
  amount: "",
  categoryId: "",
  accountId,
  date: today(),
  note: "",
});

export default function TransactionsPage() {
  const { user } = useAuth();
  const confirmDialog = useConfirm();
  const now = new Date();
  const cur = user?.currency ?? "";

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // filters
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"" | TransactionType>("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterAccount, setFilterAccount] = useState("");

  // form modal
  const [form, setForm] = useState<TxForm | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const tx = await api.get<Transaction[]>(`/api/transactions?month=${month}&year=${year}`);
    setTransactions(tx.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id));
  }, [month, year]);

  useEffect(() => {
    Promise.all([api.get<Account[]>("/api/accounts"), api.get<Category[]>("/api/categories")])
      .then(([a, c]) => {
        setAccounts(a);
        setCategories(c);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load data"));
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load transactions"));
  }, [load]);

  const filtered = useMemo(
    () =>
      transactions.filter((t) => {
        if (filterType && t.type !== filterType) return false;
        if (filterCategory && String(t.categoryId) !== filterCategory) return false;
        if (filterAccount && String(t.accountId) !== filterAccount) return false;
        if (search) {
          const q = search.toLowerCase();
          const hay = `${t.categoryName} ${t.note ?? ""} ${t.accountName} ${t.amount}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      }),
    [transactions, filterType, filterCategory, filterAccount, search]
  );

  const byDay = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const list = groups.get(t.date) ?? [];
      list.push(t);
      groups.set(t.date, list);
    }
    return [...groups.entries()];
  }, [filtered]);

  const formCategories = useMemo(
    () => (form ? categories.filter((c) => c.type === (form.type === "INCOME" ? "INCOME" : "EXPENSE")) : []),
    [categories, form]
  );

  const openNew = () => {
    setInfo(null);
    setForm(emptyForm(accounts[0] ? String(accounts[0].id) : ""));
  };

  const openEdit = (t: Transaction) => {
    setInfo(null);
    setForm({
      id: t.id,
      type: t.type,
      amount: String(t.amount),
      categoryId: String(t.categoryId),
      accountId: String(t.accountId),
      date: t.date,
      note: t.note ?? "",
    });
  };

  const ensureAccount = async (): Promise<string> => {
    if (form?.accountId) return form.accountId;
    if (accounts.length > 0) return String(accounts[0].id);
    const acc = await api.post<Account>("/api/accounts", {
      name: "Cash",
      type: "CASH",
      initialBalance: 0,
    });
    setAccounts([acc]);
    return String(acc.id);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setError(null);
    setBusy(true);
    try {
      const body = {
        accountId: Number(await ensureAccount()),
        categoryId: Number(form.categoryId),
        amount: Number(form.amount),
        type: form.type,
        date: form.date,
        note: form.note || null,
      };
      if (form.id != null) {
        await api.put<Transaction>(`/api/transactions/${form.id}`, body);
      } else {
        await api.post<Transaction>("/api/transactions", body);
      }
      setForm(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    const ok = await confirmDialog({
      title: "Delete transaction?",
      message: "This will remove it permanently and update your balances.",
    });
    if (!ok) return;
    try {
      await api.del(`/api/transactions/${id}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  /* ---------- CSV export / import ---------- */

  const exportCsv = () => {
    const rows = [
      ["date", "type", "amount", "category", "account", "note"],
      ...filtered.map((t) => [
        t.date,
        t.type,
        String(t.amount),
        t.categoryName,
        t.accountName,
        (t.note ?? "").replaceAll('"', '""'),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `transactions-${year}-${String(month).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importCsv = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      const header = lines[0].toLowerCase();
      if (!header.includes("date") || !header.includes("amount")) {
        throw new Error('CSV must have a header row with at least "date, type, amount, category" columns');
      }
      const cols = lines[0].split(",").map((c) => c.replaceAll('"', "").trim().toLowerCase());
      const idx = (name: string) => cols.indexOf(name);
      const accId = accounts[0]
        ? accounts[0].id
        : (await api.post<Account>("/api/accounts", { name: "Cash", type: "CASH", initialBalance: 0 })).id;

      let ok = 0;
      let skipped = 0;
      for (const line of lines.slice(1)) {
        const cells = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g)?.map((c) =>
          c.replace(/,$/, "").replace(/^"|"$/g, "").replaceAll('""', '"').trim()
        ) ?? [];
        const date = cells[idx("date")];
        const type = (cells[idx("type")] || "EXPENSE").toUpperCase() as TransactionType;
        const amount = Number(cells[idx("amount")]);
        const catName = (cells[idx("category")] || "").toLowerCase();
        const note = idx("note") >= 0 ? cells[idx("note")] : "";
        const cat =
          categories.find((c) => c.name.toLowerCase() === catName && c.type === (type === "INCOME" ? "INCOME" : "EXPENSE")) ??
          categories.find((c) => c.type === (type === "INCOME" ? "INCOME" : "EXPENSE"));
        if (!date || !amount || amount <= 0 || !cat) {
          skipped++;
          continue;
        }
        await api.post("/api/transactions", {
          accountId: accId,
          categoryId: cat.id,
          amount,
          type: type === "INCOME" ? "INCOME" : "EXPENSE",
          date,
          note: note || null,
        });
        ok++;
      }
      setInfo(`Imported ${ok} transaction${ok === 1 ? "" : "s"}${skipped ? `, skipped ${skipped} row(s)` : ""}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const dayTotal = (list: Transaction[]) =>
    list.reduce((s, t) => s + (t.type === "INCOME" ? t.amount : -t.amount), 0);

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Transactions</h1>
          <p>Every leke, tracked.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn secondary" onClick={exportCsv}>⬇ Export CSV</button>
          <button className="btn secondary" onClick={() => fileInput.current?.click()} disabled={busy}>
            ⬆ Import CSV
          </button>
          <input ref={fileInput} type="file" accept=".csv" hidden onChange={importCsv} />
          <button className="btn" onClick={openNew}>+ Add</button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {info && <div className="success-banner">{info}</div>}

      <div className="toolbar">
        <div className="filters">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as "" | TransactionType)}>
            <option value="">All types</option>
            <option value="EXPENSE">Expenses</option>
            <option value="INCOME">Income</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ""}{c.name}</option>
            ))}
          </select>
          {accounts.length > 1 && (
            <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)}>
              <option value="">All accounts</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
          <input
            type="search"
            placeholder="Search note, category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {byDay.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            No transactions match. Try another month or clear the filters.
          </div>
        </div>
      ) : (
        byDay.map(([date, list]) => (
          <div key={date} className="tx-day">
            <div className="tx-day-head">
              <span>{prettyDate(date)}</span>
              <span className={dayTotal(list) >= 0 ? "tx-amount income" : "tx-amount expense"}>
                {dayTotal(list) >= 0 ? "+" : "−"}{money(Math.abs(dayTotal(list)), cur)}
              </span>
            </div>
            {list.map((t) => (
              <div key={t.id} className="tx-row">
                <div className="tx-icon" style={{ background: categoryColor(t.categoryColor, t.categoryId) }}>
                  {t.categoryIcon || t.categoryName.charAt(0)}
                </div>
                <div className="tx-info">
                  <div className="tx-cat">{t.categoryName}</div>
                  {t.note && <div className="tx-note">{t.note}</div>}
                </div>
                <div className="tx-account">{t.accountName}</div>
                <div className={`tx-amount ${t.type === "INCOME" ? "income" : "expense"}`}>
                  {t.type === "INCOME" ? "+" : "−"}{money(t.amount, cur)}
                </div>
                <div className="tx-actions">
                  <button className="btn ghost" onClick={() => openEdit(t)}>Edit</button>
                  <button className="btn danger" onClick={() => remove(t.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      {form && (
        <div className="modal-backdrop" onClick={() => setForm(null)}>
          <div className="card modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 style={{ margin: 0 }}>{form.id != null ? "Edit transaction" : "New transaction"}</h3>
              <button className="btn ghost" onClick={() => setForm(null)}>✕</button>
            </div>
            <form onSubmit={save}>
              <div className="form-row">
                <div className="field">
                  <label>Type</label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value as TransactionType, categoryId: "" })
                    }
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                  </select>
                </div>
                <div className="field">
                  <label>Amount</label>
                  <input
                    type="number" min="0.01" step="0.01" required autoFocus
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Category</label>
                  <select
                    required
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  >
                    <option value="" disabled>Select…</option>
                    {formCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ""}{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Date</label>
                  <input
                    type="date" required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
              </div>
              {accounts.length > 1 && (
                <div className="field">
                  <label>Account</label>
                  <select
                    value={form.accountId}
                    onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                  >
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}
              <div className="field">
                <label>Note (optional)</label>
                <input
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="e.g. groceries at Spar"
                />
              </div>
              <button className="btn" disabled={busy} style={{ width: "100%" }}>
                {busy ? "Saving…" : "Save"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
