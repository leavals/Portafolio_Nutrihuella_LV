"use client";
/**
 * AuthContext — ahora:
 * - Expone role/isAdmin/isClient
 * - Calcula displayName desde user.name o alias del email
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

export type User = {
  id: string;
  email: string;
  name?: string | null;
  picture?: string | null;
  role?: string | null;
};

type AuthCtx = {
  user: User | null;
  token: string | null;
  role: string | null;
  isAdmin: boolean;
  isClient: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  displayName: string;
  registerEmail: (p: { name?: string; email: string; password: string }) => Promise<void>;
  loginEmail: (email: string, password: string) => Promise<void>;
  loginGoogle: (idToken: string) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);
const TOKEN_KEY = "token";

function saveToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function parseJwt(token: string | null): { role: string | null; is_admin: boolean } {
  try {
    if (!token) return { role: null, is_admin: false };
    const b64 = token.split(".")[1];
    const payload = JSON.parse(atob(b64.replace(/-/g, "+").replace(/_/g, "/")));
    return { role: payload?.role ?? null, is_admin: !!payload?.is_admin };
  } catch {
    return { role: null, is_admin: false };
  }
}

async function fetchMe(): Promise<User | null> {
  try { return await api.get<User>("/api/auth/me"); }
  catch { return null; }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]   = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole]   = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const tk = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
      if (tk) setToken(tk);
      const c = parseJwt(tk);
      setRole(c.role);
      setIsAdmin(c.is_admin || (c.role?.toLowerCase() === "admin"));

      const me = tk ? await fetchMe() : null;
      setUser(me ? { ...me, role: c.role ?? me.role ?? null } : null);
      setLoading(false);
    })();
  }, []);

  async function registerEmail(p:{name?:string; email:string; password:string}){
    setLoading(true);
    try{
      const res = await api.post<{token:string; user:User}>("/api/auth/register", p);
      saveToken(res.token);
      const c = parseJwt(res.token);
      setToken(res.token); setRole(c.role); setIsAdmin(c.is_admin || (c.role?.toLowerCase()==="admin"));
      setUser({ ...res.user, role: c.role ?? null });
    } finally{ setLoading(false); }
  }

  async function loginEmail(email:string, password:string){
    setLoading(true);
    try{
      const res = await api.post<{token:string; user:User}>("/api/auth/login", {email, password});
      saveToken(res.token);
      const c = parseJwt(res.token);
      setToken(res.token); setRole(c.role); setIsAdmin(c.is_admin || (c.role?.toLowerCase()==="admin"));
      setUser({ ...res.user, role: c.role ?? null });
    } finally{ setLoading(false); }
  }

  async function loginGoogle(idToken:string){
    setLoading(true);
    try{
      const res = await api.post<{token:string; user:User}>("/api/auth/google", {idToken});
      saveToken(res.token);
      const c = parseJwt(res.token);
      setToken(res.token); setRole(c.role); setIsAdmin(c.is_admin || (c.role?.toLowerCase()==="admin"));
      setUser({ ...res.user, role: c.role ?? null });
    } finally{ setLoading(false); }
  }

  async function refresh(){
    if (!token) return;
    setLoading(true);
    try{
      const me = await fetchMe();
      const c = parseJwt(token);
      setRole(c.role); setIsAdmin(c.is_admin || (c.role?.toLowerCase()==="admin"));
      setUser(me ? { ...me, role: c.role ?? me.role ?? null } : null);
    } finally{ setLoading(false); }
  }

  function logout(){
    saveToken(null); setToken(null); setRole(null); setIsAdmin(false); setUser(null);
  }

  const normalizedRole = (role ?? user?.role ?? "").toString().toLowerCase();
  const isClient = !isAdmin && (["usuario","cliente","user","client",""].includes(normalizedRole));
  const displayName = (user?.name && user.name.trim())
    ? user.name.trim()
    : (user?.email ? user.email.split("@")[0] : "");

  const value:AuthCtx = useMemo(()=>({
    user, token, role, isAdmin, isClient, loading,
    isAuthenticated: !!user && !!token,
    displayName,
    registerEmail, loginEmail, loginGoogle, refresh, logout
  }),[user, token, role, isAdmin, isClient, loading, displayName]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(){
  const ctx = useContext(Ctx);
  if(!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export default AuthProvider;
