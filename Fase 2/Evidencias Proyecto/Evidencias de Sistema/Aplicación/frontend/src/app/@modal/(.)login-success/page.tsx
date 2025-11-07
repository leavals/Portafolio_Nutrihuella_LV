"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { smartClose } from "@/lib/smart-close";

export default function LoginSuccessModal() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";

  useEffect(() => {
    const t = setTimeout(() => smartClose(router, next), 1200);
    return () => clearTimeout(t);
  }, [router, next]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={() => smartClose(router, next)} />
      <div className="relative z-10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl mx-auto mt-24">
        <div className="bg-white p-6">
          <h3 className="text-xl font-semibold">Inicio de sesión exitoso</h3>
          <p className="mt-2 text-slate-600">Serás redirigido al inicio en un momento…</p>
          <div className="mt-4 flex justify-end">
            <button className="btn btn-primary" onClick={() => smartClose(router, next)}>
              Ir ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
