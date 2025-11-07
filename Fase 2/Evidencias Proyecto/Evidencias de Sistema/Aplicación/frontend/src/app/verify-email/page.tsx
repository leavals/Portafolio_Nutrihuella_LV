"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";

export default function VerifyEmailPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token");

  const [state, setState] = useState<"loading"|"ok"|"bad">("loading");

  useEffect(() => {
    (async () => {
      try {
        if (!token) return setState("bad");
        await api.post("/api/auth/verify", { token });
        setState("ok");
        setTimeout(() => router.replace("/login?m=verify-ok"), 1200);
      } catch {
        setState("bad");
        setTimeout(() => router.replace("/login?m=verify-bad"), 1500);
      }
    })();
  }, [token, router]);

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow p-6 text-center">
      {state === "loading" && <p>Verificando tu cuenta…</p>}
      {state === "ok" && <p className="text-emerald-600">Cuenta verificada. Redirigiendo…</p>}
      {state === "bad" && <p className="text-red-600">Enlace inválido o expirado. Redirigiendo…</p>}
    </div>
  );
}
