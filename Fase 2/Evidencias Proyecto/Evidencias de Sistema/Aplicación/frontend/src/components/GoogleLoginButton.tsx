// src/components/GoogleLoginButton.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";

type Props = { onSuccess?: () => void };

export default function GoogleLoginButton({ onSuccess }: Props) {
  const { loginGoogle } = useAuth();
  const [ready, setReady] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!ready || !btnRef.current || !(window as any).google) return;

    (window as any).google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: async (response: any) => {
        try {
          await loginGoogle(response.credential);
          onSuccess?.();
        } catch {
          // podrías mostrar un toast de error aquí
        }
      },
    });

    (window as any).google.accounts.id.renderButton(btnRef.current, {
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
