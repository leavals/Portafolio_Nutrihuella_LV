// frontend/src/app/login/page.tsx
"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import GoogleLoginButton from "@/components/GoogleLoginButton";

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/dashboard";
  const msg = sp.get("m"); // registered | reset-sent | reset-ok | verify-ok | verify-bad

  const goNext = () => router.replace(next);

  return (
    <div className="min-h-[calc(100vh-140px)] grid place-items-center px-4 py-8">
      <div className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl bg-white grid grid-cols-1 md:grid-cols-2">
        <div className="relative min-h-[360px] hidden md:block">
          <Image src="/nutrihuella/recipe-thumb.png" alt="NutriHuella" fill className="object-cover" priority />
        </div>

        <div className="p-6 sm:p-8">
          <h1 className="text-3xl font-semibold text-ink">Iniciar sesión</h1>
          <p className="text-sm text-muted mt-1 mb-4">Accede con tu correo y contraseña o usa Google.</p>

          {/* Avisos por querystring */}
          {msg === "registered" && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Cuenta creada exitosamente. Revisa tu correo para <b>activar tu cuenta</b> antes de iniciar sesión.
            </div>
          )}
          {msg === "reset-sent" && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
              Si el correo existe, te enviamos un enlace para restablecer tu contraseña.
            </div>
          )}
          {msg === "reset-ok" && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Contraseña actualizada. Ya puedes iniciar sesión.
            </div>
          )}
          {msg === "verify-ok" && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Tu correo fue verificado. Ya puedes iniciar sesión.
            </div>
          )}
          {msg === "verify-bad" && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Enlace de verificación inválido o expirado. Solicita uno nuevo desde “¿Olvidaste tu contraseña?”.
            </div>
          )}

          <LoginForm showTitle={false} onSuccess={() => router.back()} />

          <div className="my-4 flex items-center gap-3 text-sm text-slate-500">
            <span className="flex-1 border-t" />
            <span>o</span>
            <span className="flex-1 border-t" />
          </div>

          <GoogleLoginButton onSuccess={goNext} />
        </div>
      </div>
    </div>
  );
}
