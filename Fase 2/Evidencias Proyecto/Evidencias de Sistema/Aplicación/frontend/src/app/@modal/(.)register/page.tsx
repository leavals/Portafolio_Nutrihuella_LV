// src/app/@modal/(.)register/page.tsx
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import RegisterForm from "@/components/RegisterForm";

export default function RegisterModal() {
  const router = useRouter();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={() => router.back()} />

      {/* Contenedor del modal */}
      <div
        className="
          relative z-10 w-full max-w-[1000px]
          bg-white rounded-2xl shadow-2xl overflow-hidden
          md:h-[90vh]      /* alto fijo en desktop */
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
                onClick={() => router.back()}
                aria-label="Cerrar"
                className="rounded-full px-3 py-1.5 text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="p-6 sm:p-8 pt-4 overflow-y-auto min-h-0">
              <p className="text-sm text-muted mb-6">
                Crea tu cuenta con correo y contraseña o continúa con Google.
              </p>

              <RegisterForm showTitle={false} onSuccess={() => router.back()} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
