import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const NAV = [
  { to: "/", label: "Dashboard", icon: "📊", end: true },
  { to: "/transactions", label: "Transactions", icon: "🧾" },
  { to: "/budgets", label: "Budgets", icon: "🎯" },
  { to: "/savings", label: "Savings", icon: "🐷" },
  { to: "/accounts", label: "Accounts", icon: "🏦" },
  { to: "/recurring", label: "Recurring", icon: "🔁" },
  { to: "/profile", label: "Profile", icon: "👤" },
];

export default function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">💰 Money Budget</div>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}>
            <span>{n.icon}</span> {n.label}
          </NavLink>
        ))}
        <div className="spacer" />
        <div className="hint" style={{ textAlign: "left", marginBottom: 8 }}>
          {user?.displayName || user?.email}
        </div>
        <button className="btn secondary" onClick={handleSignOut}>
          Sign out
        </button>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
