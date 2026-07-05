import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

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
        <NavLink to="/" end>
          Expenses
        </NavLink>
        <NavLink to="/profile">Profile</NavLink>
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
