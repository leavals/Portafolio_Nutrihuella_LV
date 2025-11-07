"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/lib/api";

export default function ForgotPasswordModal() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await api.post("/api/auth/forgot", { email });
      setSent(true); // siempre mostramos el mismo mensaje (seguridad)
    } catch (e:any) {
      // igual mostramos "si el email es válido..." para no filtrar usuarios
      setSent(true);
    }
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={() => router.back()} />
      <div className="relative z-10 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl mx-auto mt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 bg-white">
          {/* Imagen lateral */}
          <div className="relative min-h-[380px] hidden md:block">
            <Image
              src="/nutrihuella/recipe-thumb.png"
              alt="NutriHuella"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>

          {/* Contenido */}
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-1">Recuperar contraseña</h2>
            <p className="text-slate-600 mb-4">
              Ingresa tu email. Si es válido, te enviaremos un enlace para cambiar tu contraseña.
            </p>

            {sent ? (
              <div className="p-3 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                Si el email es válido, recibirás un correo con instrucciones para crear una nueva contraseña.
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-3">
                <label className="label" htmlFor="fp-email">Email</label>
                <input
                  id="fp-email"
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e)=>setEmail(e.target.value)}
                  required
                />
                {err && <p className="text-sm text-red-600">{err}</p>}
                <button className="btn btn-primary w-full" type="submit">Enviar enlace</button>
              </form>
            )}

            <button onClick={() => router.back()} className="mt-4 text-sm underline text-slate-600">
              Volver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
