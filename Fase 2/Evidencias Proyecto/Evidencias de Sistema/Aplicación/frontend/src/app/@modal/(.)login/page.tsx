"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import LoginForm from "@/components/LoginForm";

export default function LoginModal() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={() => router.back()} />
      <div className="relative z-10 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 bg-white">
          <div className="relative min-h-[380px] hidden md:block">
            <Image src="/nutrihuella/recipe-thumb.png" alt="NutriHuella" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-40 w-40 rounded-full bg-white/95 shadow-lg grid place-items-center">
                <Image src="/nutrihuella/logo-mark.png" alt="Logo" width={96} height={96} />
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-2xl font-semibold text-ink">Iniciar sesión</h2>
              <button onClick={() => router.back()} aria-label="Cerrar" className="rounded-full px-3 py-1.5 text-slate-500 hover:bg-slate-100">
                ×
              </button>
            </div>

            <p className="text-sm text-muted mb-6">Accede con tu correo y contraseña o usa Google.</p>
            <LoginForm onSuccess={() => router.back()} showTitle={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
