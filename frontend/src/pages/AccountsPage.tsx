import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { Account, AccountType } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { useConfirm } from "../components/Confirm";
import { money } from "../utils/format";

const TYPE_META: Record<AccountType, { label: string; icon: string; gradient: string }> = {
  CASH: { label: "Cash", icon: "💵", gradient: "linear-gradient(135deg, #16a34a, #22c55e)" },
  BANK: { label: "Bank", icon: "🏦", gradient: "linear-gradient(135deg, #0369a1, #0ea5e9)" },
  SAVINGS: { label: "Savings", icon: "🐷", gradient: "linear-gradient(135deg, #15803d, #4ade80)" },
  CREDIT: { label: "Credit card", icon: "💳", gradient: "linear-gradient(135deg, #7c3aed, #a78bfa)" },
};

export default function AccountsPage() {
  const { user } = useAuth();
  const confirmDialog = useConfirm();
  const cur = user?.currency ?? "";

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("BANK");
  const [initial, setInitial] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setAccounts(await api.get<Account[]>("/api/accounts"));
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load accounts"));
  }, [load]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post<Account>("/api/accounts", {
        name,
        type,
        initialBalance: initial === "" ? 0 : Number(initial),
      });
      setName(""); setInitial(""); setType("BANK");
      setShowNew(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create account");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    const ok = await confirmDialog({
      title: "Delete account?",
      message: "Transactions linked to this account may be affected.",
    });
    if (!ok) return;
    try {
      await api.del(`/api/accounts/${id}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete account");
    }
  };

  const total = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Accounts</h1>
          <p>Total across all accounts: <b>{money(total, cur)}</b></p>
        </div>
        <button className="btn" onClick={() => setShowNew((s) => !s)}>
          {showNew ? "Cancel" : "+ New account"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showNew && (
        <div className="card anim-in" style={{ marginBottom: 20, maxWidth: 560 }}>
          <h3>New account</h3>
          <form onSubmit={create}>
            <div className="form-row-3">
              <div className="field">
                <label>Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Raiffeisen" />
              </div>
              <div className="field">
                <label>Type</label>
                <select value={type} onChange={(e) => setType(e.target.value as AccountType)}>
                  {(Object.keys(TYPE_META) as AccountType[]).map((t) => (
                    <option key={t} value={t}>{TYPE_META[t].icon} {TYPE_META[t].label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Starting balance</label>
                <input type="number" step="0.01" value={initial} onChange={(e) => setInitial(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <button className="btn" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
          </form>
        </div>
      )}

      {accounts.length === 0 && !showNew ? (
        <div className="card">
          <div className="empty-state">No accounts yet — add your cash, bank and cards to keep balances separate.</div>
        </div>
      ) : (
        <div className="goal-grid">
          {accounts.map((a, i) => {
            const meta = TYPE_META[a.type] ?? TYPE_META.BANK;
            return (
              <div
                key={a.id}
                className={`account-card anim-in-${Math.min(i, 3)}`}
                style={{ background: meta.gradient }}
              >
                <div className="row">
                  <div>
                    <div className="name">{meta.icon} {a.name}</div>
                    <div className="type">{meta.label}</div>
                  </div>
                  <button
                    className="btn danger"
                    style={{ color: "rgba(255,255,255,0.9)" }}
                    onClick={() => remove(a.id)}
                  >
                    ✕
                  </button>
                </div>
                <div className="balance">{money(a.balance, cur)}</div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
