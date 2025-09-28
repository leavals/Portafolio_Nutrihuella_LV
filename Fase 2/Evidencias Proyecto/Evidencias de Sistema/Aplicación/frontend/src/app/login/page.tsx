// src/app/login/page.tsx
"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import GoogleLoginButton from "@/components/GoogleLoginButton";

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/dashboard";

  const goNext = () => {
    // Reemplaza para no dejar /login en el history
    router.replace(next);
  };

  return (
    <div className="min-h-[calc(100vh-140px)] grid place-items-center px-4 py-8">
      <div className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl bg-white grid grid-cols-1 md:grid-cols-2">
        <div className="relative min-h-[360px] hidden md:block">
          <Image
            src="/nutrihuella/recipe-thumb.png"
            alt="NutriHuella"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="p-6 sm:p-8">
          <h1 className="text-3xl font-semibold text-ink">Iniciar sesión</h1>
          <p className="text-sm text-muted mt-1 mb-6">
            Accede con tu correo y contraseña o usa Google.
          </p>

          {/* Login por email/clave: al éxito -> volver a next */}
          <LoginForm showTitle={false} onSuccess={() => router.back()} />

          <div className="my-4 flex items-center gap-3 text-sm text-slate-500">
            <span className="flex-1 border-t" />
            <span>o</span>
            <span className="flex-1 border-t" />
          </div>

          {/* Google Login: al éxito -> volver a next */}
          <GoogleLoginButton onSuccess={() => router.back()} />
        </div>
      </div>
    </div>
  );
}
