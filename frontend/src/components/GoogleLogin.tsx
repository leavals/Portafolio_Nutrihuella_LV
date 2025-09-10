"use client";

import { useEffect, useRef, useState } from "react";

declare global { interface Window { google?: any } }

/**
 * Renderiza el botón oficial de Google Identity Services y,
 * al recibir el ID Token, lo envía a tu backend /api/auth/google.
 * Si el backend responde OK, guardamos el JWT (nh_token) y ejecutamos onSuccess().
 */
export default function GoogleLogin({ onSuccess }: { onSuccess?: (jwt: string) => void }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) { setError("Falta NEXT_PUBLIC_GOOGLE_CLIENT_ID"); return; }

    const scriptId = "gis-script";
    if (!document.getElementById(scriptId)) {
      const s = document.createElement("script");
      s.id = scriptId;
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true; s.defer = true;
      s.onload = init; document.body.appendChild(s);
    } else { init(); }

    function init() {
      if (!window.google || !divRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp: any) => {
          try {
            // resp.credential = ID Token de Google
            const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/google`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken: resp.credential }),
            });
            const j = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(j.message || "No se pudo iniciar sesión");

            localStorage.setItem("nh_token", j.token);
            onSuccess?.(j.token);
          } catch (e: any) {
            setError(e.message ?? "Error de autenticación");
          }
        },
        ux_mode: "popup",
      });

      window.google.accounts.id.renderButton(divRef.current, {
        theme: "filled", size: "large", shape: "pill", text: "signin_with",
        width: 280, logo_alignment: "left",
      });
    }
  }, [onSuccess]);

  return (
    <div className="flex flex-col items-center">
      <div ref={divRef} />
      {error && <p className="mt-3 text-sm text-nh-coral">{error}</p>}
    </div>
  );
}
