// frontend/src/app/(auth)/reset-password/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/lib/api";

export default function ResetPasswordPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") || "";

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const disabled = !token || p1.length < 8 || p1 !== p2;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await api.post("/api/auth/reset", { token, newPassword: p1 });
      setOk(true);
      setTimeout(() => router.replace("/login?m=reset-ok"), 1200);
    } catch (e: any) {
      setErr(e?.message || "No se pudo restablecer la contraseña");
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow p-6">
      <h1 className="text-2xl font-semibold mb-2">Crear nueva contraseña</h1>
      {!token && <p className="text-red-600">Falta el token.</p>}
      {ok ? (
        <p className="text-emerald-600">Contraseña actualizada. Redirigiendo…</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="label" htmlFor="p1">Nueva contraseña</label>
          <input id="p1" className="input" type="password" value={p1} onChange={(e)=>setP1(e.target.value)} required />

          <label className="label" htmlFor="p2">Confirmar contraseña</label>
          <input id="p2" className="input" type="password" value={p2} onChange={(e)=>setP2(e.target.value)} required />

          {err && <p className="text-sm text-red-600">{err}</p>}

          <button className="btn btn-primary w-full disabled:opacity-50" disabled={disabled} type="submit">
            Guardar
          </button>
        </form>
      )}
    </div>
  );
}
