"use client";
import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";

declare global { interface Window { google?: any; } }

export default function GoogleLoginButton() {
  const { loginGoogle } = useAuth();
  const btnRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (!clientId) { console.error("Falta NEXT_PUBLIC_GOOGLE_CLIENT_ID"); return; }

    const ensureScript = () =>
      new Promise<void>((resolve, reject) => {
        if (window.google?.accounts?.id) return resolve();
        const s = document.createElement("script");
        s.src = "https://accounts.google.com/gsi/client";
        s.async = true; s.defer = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("No se pudo cargar Google Identity Services"));
        document.head.appendChild(s);
      });

    let cancelled = false;
    (async () => {
      try {
        await ensureScript();
        if (cancelled) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (resp: any) => {
            try {
              const idToken = resp.credential as string;
              await loginGoogle(idToken);
              window.location.href = "/dashboard";
            } catch (e) {
              console.error("Fallo loginGoogle", e);
              alert("No se pudo iniciar sesión con Google.");
            }
          },
        });

        if (btnRef.current) {
          window.google.accounts.id.renderButton(btnRef.current, {
            theme: "outline", size: "large", type: "standard",
            shape: "rectangular", text: "signin_with", logo_alignment: "left",
          });
        }
      } catch (e) { console.error(e); }
    })();

    return () => { cancelled = true; try { window.google?.accounts?.id?.cancel(); } catch {} };
  }, [clientId, loginGoogle]);

  return <div ref={btnRef} />;
}
