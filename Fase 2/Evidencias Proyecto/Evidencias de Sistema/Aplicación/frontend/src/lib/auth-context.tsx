// src/lib/auth-context.tsx
'use client';
/**
 * Contexto de autenticación:
 * - Mantiene user/token/role/plan
 * - Guarda token en localStorage y cookie legible por middleware
 * - Expone helpers: login/register/google/refresh/logout/cancelPlus
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

// Debe coincidir con middleware.ts
const AUTH_COOKIE = 'auth_token';
const TOKEN_KEY = 'token';

// Cookies no-HttpOnly (para middleware)
function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
}
function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export type Plan = 'BASIC' | 'PLUS';

export type User = {
  id: string;
  email: string;
  name?: string | null;
  picture?: string | null;
  role?: string | null;
  plan?: Plan | null; // <<< agregado
};

type AuthCtx = {
  user: User | null;
  token: string | null;
  role: string | null;
  plan: Plan | null;       // <<< agregado
  isPlus: boolean;         // <<< agregado
  isAdmin: boolean;
  isClient: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  displayName: string;
  registerEmail: (p: { name?: string; email: string; password: string }) => Promise<void>;
  loginEmail: (email: string, password: string) => Promise<void>;
  loginGoogle: (idToken: string) => Promise<void>;
  cancelPlus: () => Promise<void>; // <<< agregado
  refresh: () => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

function saveToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    setCookie(AUTH_COOKIE, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
    deleteCookie(AUTH_COOKIE);
  }
}

function parseJwt(token: string | null): { role: string | null; is_admin: boolean } {
  try {
    if (!token) return { role: null, is_admin: false };
    const [, payloadB64] = token.split('.');
    const b64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const json = typeof atob !== 'undefined' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    const payload = JSON.parse(json);
    return { role: payload?.role ?? null, is_admin: !!payload?.is_admin };
  } catch {
    return { role: null, is_admin: false };
  }
}

async function fetchMe(): Promise<User | null> {
  try {
    // Debe devolver { id, email, name, picture?, plan? }
    return await api.get<User>('/api/auth/me');
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const tk = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) || null : null;
      if (tk) setToken(tk);
      const c = parseJwt(tk);
      setRole(c.role);
      setIsAdmin(c.is_admin || c.role?.toLowerCase() === 'admin');

      const me = tk ? await fetchMe() : null;
      setUser(me ? { ...me, role: c.role ?? me.role ?? null } : null);
      setLoading(false);
    })();
  }, []);

  const isClient = !!role && role.toLowerCase() === 'client';
  const isAuthenticated = !!token;
  const plan: Plan | null = (user?.plan as Plan | undefined) ?? null;
  const isPlus = plan === 'PLUS';

  const displayName = useMemo(() => {
    if (user?.name && user.name.trim()) return user.name.trim();
    if (user?.email) return user.email.split('@')[0];
    return 'Usuario';
  }, [user]);

  async function registerEmail(p: { name?: string; email: string; password: string }) {
    setLoading(true);
    try {
      await api.post('/api/auth/register', p);
    } finally {
      setLoading(false);
    }
  }

  async function loginEmail(email: string, password: string) {
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: User }>('/api/auth/login', { email, password });
      saveToken(res.token);
      const c = parseJwt(res.token);
      setToken(res.token);
      setRole(c.role);
      setIsAdmin(c.is_admin || c.role?.toLowerCase() === 'admin');
      setUser({ ...res.user, role: c.role ?? null });
    } finally {
      setLoading(false);
    }
  }

  async function loginGoogle(idToken: string) {
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: User }>('/api/auth/google', { idToken });
      saveToken(res.token);
      const c = parseJwt(res.token);
      setToken(res.token);
      setRole(c.role);
      setIsAdmin(c.is_admin || c.role?.toLowerCase() === 'admin');
      setUser({ ...res.user, role: c.role ?? null });
    } finally {
      setLoading(false);
    }
  }

  async function cancelPlus() {
    setLoading(true);
    try {
      await api.post('/api/users/plus/cancel');
      const me = await fetchMe();
      setUser(me);
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    if (!token) return;
    setLoading(true);
    try {
      const me = await fetchMe();
      const c = parseJwt(token);
      setRole(c.role);
      setIsAdmin(c.is_admin || c.role?.toLowerCase() === 'admin');
      setUser(me ? { ...me, role: c.role ?? me.role ?? null } : null);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setUser(null);
    setRole(null);
    setIsAdmin(false);
    setToken(null);
    saveToken(null);
    router.push('/');
  }

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      token,
      role,
      plan,
      isPlus,
      isAdmin,
      isClient,
      loading,
      isAuthenticated,
      displayName,
      registerEmail,
      loginEmail,
      loginGoogle,
      cancelPlus,
      refresh,
      logout,
    }),
    [user, token, role, plan, isPlus, isAdmin, isClient, loading, isAuthenticated, displayName]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export default AuthProvider;
