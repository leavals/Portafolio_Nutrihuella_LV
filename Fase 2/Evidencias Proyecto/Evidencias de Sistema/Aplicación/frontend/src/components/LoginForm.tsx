// src/components/LoginForm.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { TextField, PasswordField } from "@/components/form/Fields";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  onSuccess?: () => void; // usado por /login para manejar ?next
  showTitle?: boolean;
};

export default function LoginForm({ onSuccess, showTitle = true }: Props) {
  const { loginEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const emailValid = EMAIL_RE.test(email);
  const disabled = !emailValid || pw.length < 4;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;
    setErr(null);
    try {
      await loginEmail(email, pw);
      if (onSuccess) onSuccess();
      // Si no se pasa onSuccess, no forzamos redirección aquí.
      // Dejas este else vacío o redirige a un default si lo prefieres.
    } catch (e: any) {
      setErr(e?.message || "Credenciales inválidas");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card max-w-md" noValidate>
      {showTitle && (
        <>
          <h1 className="text-2xl font-semibold text-ink mb-1">Iniciar sesión</h1>
          <p className="text-sm text-muted mb-4">Accede con tu correo y contraseña.</p>
        </>
      )}

      <TextField
        id="login-email"
        label="Email"
        placeholder="tucorreo@dominio.com"
        value={email}
        onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
        error={!emailValid && email.length > 0 ? "Email inválido" : undefined}
        required
      />

      <PasswordField
        id="login-password"
        label="Contraseña"
        placeholder="********"
        value={pw}
        onChange={(e) => setPw((e.target as HTMLInputElement).value)}
        required
      />

      {err && <p className="text-sm text-red-600 mt-2">{err}</p>}

      <button type="submit" className="btn btn-primary w-full mt-4 disabled:opacity-50" disabled={disabled}>
        Entrar
      </button>

      <p className="text-sm text-slate-600 mt-4">
        ¿No tienes cuenta?{" "}
        <Link className="underline text-[var(--nh-primary)]" href="/register">
          Regístrate
        </Link>
      </p>
    </form>
  );
}
