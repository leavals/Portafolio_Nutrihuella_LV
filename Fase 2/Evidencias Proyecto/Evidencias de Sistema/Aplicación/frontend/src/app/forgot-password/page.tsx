// frontend/src/app/(auth)/forgot-password/page.tsx
"use client";

import { useState } from "react";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await api.post("/api/auth/forgot", { email });
      setSent(true);
    } catch (e: any) {
      setErr(e?.message || "No se pudo enviar el correo");
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow p-6">
      <h1 className="text-2xl font-semibold mb-2">Restablecer contraseña</h1>
      <p className="text-sm text-muted mb-4">
        Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
      </p>

      {sent ? (
        <p className="text-emerald-600">Si el correo existe, recibirás un mensaje con instrucciones.</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className="btn btn-primary w-full" type="submit">Enviar enlace</button>
        </form>
      )}
    </div>
  );
}
