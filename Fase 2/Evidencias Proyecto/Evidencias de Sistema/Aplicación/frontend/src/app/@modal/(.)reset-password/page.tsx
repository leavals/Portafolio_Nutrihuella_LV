"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import api from "@/lib/api";
import { smartClose } from "@/lib/smart-close";

export default function ResetPasswordModal() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get("token") || "";
  const next = sp.get("next") || "/";

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const disabled = !p1 || !p2 || p1 !== p2;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (p1 !== p2) {
      setErr("Las contraseñas no coinciden");
      return;
    }
    try {
      await api.post("/api/auth/reset", { token, newPassword: p1 });
      setOk(true);
      // Importante: pasa next para que el modal de login pueda cerrar o redirigir correctamente
      setTimeout(() => {
        router.replace(`/login?m=reset-ok&next=${encodeURIComponent(next)}`);
      }, 1500);
    } catch (e: any) {
      setErr(e?.message || "No se pudo actualizar la contraseña");
    }
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => smartClose(router, next)}
      />
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
            <h2 className="text-2xl font-semibold mb-1">Crear nueva contraseña</h2>
            <p className="text-slate-600 mb-4">
              Ingresa tu nueva contraseña y confírmala para continuar.
            </p>

            {ok ? (
              <div className="p-3 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                ¡Listo! Tu contraseña fue actualizada. Redirigiendo al login…
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-3">
                <label className="label" htmlFor="np1">
                  Nueva contraseña
                </label>
                <input
                  id="np1"
                  className="input"
                  type="password"
                  value={p1}
                  onChange={(e) => setP1((e.target as HTMLInputElement).value)}
                  required
                />

                <label className="label" htmlFor="np2">
                  Confirmar contraseña
                </label>
                <input
                  id="np2"
                  className="input"
                  type="password"
                  value={p2}
                  onChange={(e) => setP2((e.target as HTMLInputElement).value)}
                  required
                />

                {err && <p className="text-sm text-red-600">{err}</p>}

                <button
                  className="btn btn-primary w-full disabled:opacity-50"
                  disabled={disabled}
                  type="submit"
                >
                  Guardar
                </button>
              </form>
            )}

            <button
              onClick={() => smartClose(router, next)}
              className="mt-4 text-sm underline text-slate-600"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
