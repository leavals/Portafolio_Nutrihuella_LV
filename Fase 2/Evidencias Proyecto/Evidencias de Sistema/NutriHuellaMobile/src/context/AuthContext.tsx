// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin, register as apiRegister, me as apiMe, googleLogin as apiGoogleLogin } from '@/services/auth';
import { getItem, setItem, deleteItem } from '@/services/storage';

type User = { id: string; name: string; email: string; picture?: string | null };
type Ctx = {
  user: User | null; isAuthenticated: boolean; initializing: boolean;
  login: (e:string,p:string)=>Promise<void>;
  register: (n:string,e:string,p:string)=>Promise<void>;
  googleLogin: (idToken:string)=>Promise<void>;
  logout: ()=>Promise<void>;
};

const AuthContext = createContext<Ctx>(null as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User|null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => { (async () => {
    const t = await getItem('auth_token');
    if (t) { try { const u = await apiMe(); setUser(u); } catch {} }
    setInitializing(false);
  })(); }, []);

  const login = async (email:string, password:string) => {
    const res = await apiLogin(email, password);
    await setItem('auth_token', res.token);
    setUser(res.user);
  };
  const register = async (name:string, email:string, password:string) => {
    const res = await apiRegister(name, email, password);
    await setItem('auth_token', res.token);
    setUser(res.user);
  };
  const googleLogin = async (idToken:string) => {
    const res = await apiGoogleLogin(idToken);
    await setItem('auth_token', res.token);
    setUser(res.user);
  };
  const logout = async () => { await deleteItem('auth_token'); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, initializing, login, register, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
