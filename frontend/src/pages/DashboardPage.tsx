import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import {
  Account,
  RecurringTransaction,
  Summary,
  TrendPoint,
} from "../api/types";
import { DonutChart, TrendChart } from "../components/Charts";
import { useAuth } from "../auth/AuthContext";
import { MONTHS, categoryColor, money } from "../utils/format";

export default function DashboardPage() {
  const { user } = useAuth();
  const now = new Date();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  const cur = user?.currency ?? "";

  useEffect(() => {
    Promise.all([
      api.get<Summary>("/api/reports/summary"),
      api.get<TrendPoint[]>("/api/reports/trend?months=6"),
      api.get<Account[]>("/api/accounts"),
      api.get<RecurringTransaction[]>("/api/recurring-transactions"),
    ])
      .then(([s, t, a, r]) => {
        setSummary(s);
        setTrend(t);
        setAccounts(a);
        setRecurring(r);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load dashboard"));
  }, []);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const overspent = summary?.budgets?.filter((b) => b.overspent) ?? [];

  const soon = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);
  const upcoming = recurring
    .filter((r) => r.active && r.nextRunDate <= soon)
    .sort((a, b) => a.nextRunDate.localeCompare(b.nextRunDate));

  const topExpenses = (summary?.expenseByCategory ?? []).slice(0, 6).map((c, i) => ({
    label: c.categoryName,
    value: c.total,
    icon: c.categoryIcon,
    color: categoryColor(c.categoryColor, c.categoryId ?? i),
  }));

  return (
    <>
      <div className="page-title">
        <h1>Hi{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""} 👋</h1>
        <p>Here's your money at a glance — {MONTHS[now.getMonth()]} {now.getFullYear()}.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {overspent.length > 0 && (
        <div className="warn-banner">
          ⚠️ Over budget in{" "}
          {overspent.map((b) => b.categoryName).join(", ")} —{" "}
          <Link to="/budgets">review budgets</Link>
        </div>
      )}
      {upcoming.length > 0 && (
        <div className="warn-banner">
          📅 Coming up:{" "}
          {upcoming
            .slice(0, 3)
            .map((r) => `${r.categoryName} (${money(r.amount, cur)}) on ${r.nextRunDate}`)
            .join(" · ")}
        </div>
      )}

      <div className="stat-grid">
        <div className="card hero-balance anim-in">
          <div className="stat-label">Total balance</div>
          <div className="stat-value">{money(totalBalance, cur)}</div>
          <div className="stat-sub">{accounts.length} account{accounts.length === 1 ? "" : "s"}</div>
        </div>
        <div className="card anim-in-1">
          <div className="stat-label">Income this month</div>
          <div className="stat-value income">{money(summary?.totalIncome ?? 0, cur)}</div>
        </div>
        <div className="card anim-in-2">
          <div className="stat-label">Spent this month</div>
          <div className="stat-value expense">{money(summary?.totalExpenses ?? 0, cur)}</div>
        </div>
        <div className="card anim-in-3">
          <div className="stat-label">Net this month</div>
          <div className="stat-value" style={{ color: (summary?.netBalance ?? 0) >= 0 ? "var(--green-600)" : "var(--red-600)" }}>
            {money(summary?.netBalance ?? 0, cur)}
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="card anim-in-2">
          <h3>Spending by category</h3>
          <DonutChart segments={topExpenses} currency={cur} centerLabel="Spent" />
        </div>
        <div className="card anim-in-3">
          <h3>Income vs expenses — last 6 months</h3>
          <TrendChart points={trend} currency={cur} />
          <div className="chart-legend">
            <span><span className="legend-dot" style={{ background: "#22c55e" }} />Income</span>
            <span><span className="legend-dot" style={{ background: "#f87171" }} />Expenses</span>
          </div>
        </div>
      </div>

      {summary?.budgets && summary.budgets.length > 0 && (
        <div className="card anim-in-3" style={{ marginBottom: 20 }}>
          <div className="row-between" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Budgets this month</h3>
            <Link to="/budgets" className="btn ghost">Manage →</Link>
          </div>
          <div className="list-plain">
            {summary.budgets.map((b) => {
              const pct = Math.min(100, (b.spent / b.monthlyLimit) * 100);
              return (
                <div key={b.id}>
                  <div className="row-between" style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 14 }}>
                      {b.categoryIcon ? `${b.categoryIcon} ` : ""}{b.categoryName}
                    </span>
                    <span className="muted">
                      {money(b.spent, cur)} / {money(b.monthlyLimit, cur)}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className={`progress-fill ${b.overspent ? "over" : pct > 80 ? "warn" : ""}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
