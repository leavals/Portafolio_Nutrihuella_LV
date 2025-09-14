"use client";

import { useState } from "react";
import Link from "next/link";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { useAuth } from "@/lib/auth-context";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { loginEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const emailValid = EMAIL_RE.test(email);
  const disabled = !emailValid || pw.length < 8;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await loginEmail(email, pw);
      location.assign("/dashboard");
    } catch (e: any) {
      setErr(e?.message || "Credenciales inválidas");
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-2">Iniciar sesión</h1>
      <p className="text-slate-600 mb-6">Accede con tu correo y contraseña.</p>

      <form onSubmit={onSubmit} className="card max-w-md" noValidate>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)}
               aria-invalid={!emailValid} placeholder="tucorreo@dominio.com" required />
        {!emailValid && email.length>0 && <p className="help text-[var(--nh-danger)]">Email inválido</p>}

        <div className="mt-4">
          <label className="label" htmlFor="pw">Contraseña</label>
          <div className="relative">
            <input id="pw" className="input pr-10" type={showPw?"text":"password"} value={pw}
                   onChange={e=>setPw(e.target.value)} required minLength={8} />
            <button type="button" onClick={()=>setShowPw(v=>!v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    aria-label={showPw? "Ocultar contraseña":"Mostrar contraseña"}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                {showPw
                  ? (<><path d="M3 3l18 18" stroke="currentColor" strokeWidth="2"/><path d="M10.6 10.6A2 2 0 0012 14a2 2 0 001.4-3.4M4.5 4.5C2.3 6 1 8 1 8s4 8 11 8c2.1 0 3.9-.6 5.4-1.5" stroke="currentColor" strokeWidth="2"/></>)
                  : (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></>)
                }
              </svg>
            </button>
          </div>
        </div>

        {err && <p className="mt-3 text-sm text-[var(--nh-danger)]" role="status" aria-live="polite">{err}</p>}

        <button type="submit" className="btn btn-primary w-full mt-6 disabled:opacity-50" disabled={disabled}>
          Entrar
        </button>

        {/* Divisor */}
        <div className="my-4 flex items-center gap-3 text-sm text-slate-500">
          <span className="flex-1 border-t" />
          <span>o</span>
          <span className="flex-1 border-t" />
        </div>

        {/* Google Sign-In */}
        <GoogleLoginButton />

        <p className="text-sm text-slate-600 mt-4">
          ¿No tienes cuenta? <Link className="underline text-[var(--nh-primary)]" href="/register">Regístrate</Link>
        </p>
      </form>
    </>
  );
}
