import { createContext, useContext, useState, ReactNode } from "react";
import { AuthResponse } from "../api/types";
import { clearSession, getStoredUser, getToken, setSession } from "../api/client";

export interface SessionUser {
  email: string;
  displayName: string;
  currency: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  isAuthenticated: boolean;
  signIn: (auth: AuthResponse) => void;
  signOut: () => void;
  updateUser: (patch: Partial<SessionUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() =>
    getToken() ? getStoredUser<SessionUser>() : null
  );

  const signIn = (auth: AuthResponse) => {
    const sessionUser: SessionUser = {
      email: auth.email,
      displayName: auth.displayName,
      currency: auth.currency,
    };
    setSession(auth.token, sessionUser);
    setUser(sessionUser);
  };

  const signOut = () => {
    clearSession();
    setUser(null);
  };

  const updateUser = (patch: Partial<SessionUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem("budget.user", JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
