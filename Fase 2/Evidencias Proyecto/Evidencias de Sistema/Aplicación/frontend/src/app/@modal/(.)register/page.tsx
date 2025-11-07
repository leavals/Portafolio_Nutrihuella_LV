// src/app/@modal/(.)register/page.tsx
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import RegisterForm from "@/components/RegisterForm";

export default function RegisterModal() {
  const router = useRouter();
  const [justRegistered, setJustRegistered] = useState(false);

  function handleRegistered() {
    setJustRegistered(true);
    try { localStorage.removeItem("token"); } catch {}
    setTimeout(() => router.replace("/login?m=registered"), 1600);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={!justRegistered ? () => router.back() : undefined}
      />

      {/* Contenedor del modal */}
      <div
        className="
          relative z-10 w-full max-w-[1000px]
          bg-white rounded-2xl shadow-2xl overflow-hidden
          md:h-[90vh]
        "
      >
        {/* Layout robusto con FLEX (no grid) */}
        <div className="h-full w-full flex flex-col md:flex-row">
          {/* Lado izquierdo: imagen fija (oculta en mobile) */}
          <aside className="relative hidden md:block basis-[380px] shrink-0">
            <div className="sticky top-0 h-[90vh] overflow-hidden">
              <Image
                src="/nutrihuella/recipe-thumb.png"
                alt="NutriHuella"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-40 w-40 rounded-full bg-white/95 shadow-lg grid place-items-center">
                  <Image src="/nutrihuella/logo-mark.png" alt="Logo" width={96} height={96} />
                </div>
              </div>
            </div>
          </aside>

          {/* Lado derecho: formulario con scroll propio */}
          <section className="flex-1 min-w-0 flex flex-col h-full">
            {/* Header fijo */}
            <div className="flex items-start justify-between p-6 sm:p-8 pb-0">
              <h2 className="text-2xl font-semibold text-ink">Regístrate</h2>
              <button
                onClick={!justRegistered ? () => router.back() : undefined}
                aria-label="Cerrar"
                className="rounded-full px-3 py-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                disabled={justRegistered}
              >
                ×
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="flex-1 min-h-0 p-6 sm:p-8 pt-4 overflow-y-auto">
              {justRegistered ? (
                <div className="max-w-lg mx-auto">
                  {/* Aviso verde */}
                  <div
                    role="alert"
                    aria-live="polite"
                    className="mb-4 rounded-lg border border-emerald-600 bg-emerald-50 p-3 text-emerald-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
                      <span className="font-medium">
                        Cuenta creada con éxito. Redirigiendo al login…
                      </span>
                    </div>
                  </div>

                  {/* Texto “si no…” */}
                  <p className="text-center text-sm text-muted">
                    Si no eres redirigido automáticamente,{" "}
                    <button
                      className="underline"
                      onClick={() => router.replace("/login?m=registered")}
                    >
                      haz clic aquí
                    </button>.
                  </p>

                  {/* Imagen debajo, centrada */}
                  <Image
                    src="/nutrihuella/pets-success.png"  // pon la extensión que tengas: .png/.webp/.svg
                    alt="Registro exitoso - mascotas felices"
                    width={240}
                    height={240}
                    className="mx-auto mt-6 drop-shadow"
                    priority
                  />
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted mb-6">
                    Crea tu cuenta con correo y contraseña o continúa con Google.
                  </p>
                  <RegisterForm showTitle={false} onSuccess={handleRegistered} />
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
