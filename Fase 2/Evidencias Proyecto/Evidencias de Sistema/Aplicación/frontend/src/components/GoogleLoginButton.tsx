"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";

type Props = { onSuccess?: () => void };

export default function GoogleLoginButton({ onSuccess }: Props) {
  const { loginGoogle } = useAuth();
  const [ready, setReady] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);

  // Carga del script GSI
  useEffect(() => {
    const id = "google-gsi";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.id = id;
      s.onload = () => setReady(true);
      document.head.appendChild(s);
    } else {
      setReady(true);
    }
  }, []);

  // Inicializa el botón
  useEffect(() => {
    if (!ready || !btnRef.current) return;

    const g = (window as any)?.google;
    if (!g?.accounts?.id) return;

    const client_id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!client_id) {
      console.error("Falta NEXT_PUBLIC_GOOGLE_CLIENT_ID");
      return;
    }

    (g.accounts.id as any).initialize({
      client_id,
      // algunos d.ts viejos no incluyen esta prop -> forzamos any
      ux_mode: "popup",
      callback: async (response: { credential?: string }) => {
        try {
          if (!response?.credential) throw new Error("No llegó credential de Google");

          // (opcional) inspección payload para depurar audiencia/email
          try {
            const payload = JSON.parse(atob(response.credential.split(".")[1]));
            console.log("[GSI payload]", {
              aud: payload?.aud,
              email: payload?.email,
              iss: payload?.iss,
              sub: payload?.sub,
              email_verified: payload?.email_verified,
            });
          } catch {}

          await loginGoogle(response.credential);
          onSuccess?.();
        } catch (err) {
          console.error("Fallo login con Google:", err);
          alert("No se pudo iniciar sesión con Google.");
        }
      },
    } as any);

    (g.accounts.id as any).renderButton(btnRef.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      logo_alignment: "left",
      text: "signin_with",
    } as any);
  }, [ready, onSuccess, loginGoogle]);

  return (
    <div className="w-full flex justify-center">
      <div ref={btnRef} />
    </div>
  );
}
