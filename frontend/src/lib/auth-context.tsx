"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type User = { id: string; email: string; name?: string; picture?: string } | null;
type AuthCtx = {
  user: User; loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  loginGoogle: (idToken: string) => Promise<void>;
  loginEmail: (email: string, password: string) => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const u = localStorage.getItem("user");
      if (token && u) setUser(JSON.parse(u));
    } catch {}
    setLoading(false);
  }, []);

  const login = (token: string, u: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    if (typeof window !== "undefined") window.location.href = "/login";
  };

  const loginGoogle = async (idToken: string) => {
    const resp = await api.post<{ token: string; user: NonNullable<User> }>("/api/auth/google", { idToken });
    login(resp.token, resp.user);
  };

  const loginEmail = async (email: string, password: string) => {
    const resp = await api.post<{ token: string; user: NonNullable<User> }>("/api/auth/login", { email, password });
    login(resp.token, resp.user);
  };

  const value = useMemo<AuthCtx>(() => ({ user, loading, login, logout, loginGoogle, loginEmail }), [user, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
