// frontend/src/lib/auth-context.tsx
"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type User = { id: string; email: string; name?: string; picture?: string };
type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  loginGoogle: (idToken: string) => Promise<void>;
  loginEmail: (email: string, password: string) => Promise<void>;
  registerEmail: (name: string | undefined, email: string, password: string) => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Intenta levantar sesión con token existente
  useEffect(() => {
    (async () => {
      try {
        const me = await api.get<User>("/api/auth/me");
        setUser(me);
      } catch {
        // sin sesión
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = (token: string, u: User) => {
    localStorage.setItem("token", token);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const loginGoogle = async (idToken: string) => {
    const resp = await api.post<{ token: string; user: User }>("/api/auth/google", { idToken });
    login(resp.token, resp.user);
  };

  const loginEmail = async (email: string, password: string) => {
    const resp = await api.post<{ token: string; user: User }>("/api/auth/login", { email, password });
    login(resp.token, resp.user);
  };

  const registerEmail = async (name: string | undefined, email: string, password: string) => {
    const resp = await api.post<{ token: string; user: User }>("/api/auth/register", { name, email, password });
    login(resp.token, resp.user);
  };

  const value = useMemo(
    () => ({ user, loading, login, logout, loginGoogle, loginEmail, registerEmail }),
    [user, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
