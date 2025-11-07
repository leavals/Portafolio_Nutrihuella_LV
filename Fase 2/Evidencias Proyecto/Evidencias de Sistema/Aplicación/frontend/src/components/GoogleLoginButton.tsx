// src/components/GoogleLoginButton.tsx
"use client";

/// <reference types="google.accounts" />

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";

type Props = { onSuccess?: () => void };

export default function GoogleLoginButton({ onSuccess }: Props) {
  const { loginGoogle } = useAuth();
  const btnRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);
  const renderedRef = useRef(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const initAndRender = () => {
      if (!window.google?.accounts?.id) return;
      if (!btnRef.current) return;

      if (!clientId) {
        console.error("Falta NEXT_PUBLIC_GOOGLE_CLIENT_ID");
        return;
      }

      if (!initializedRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (resp) => {
            try {
              await loginGoogle(resp.credential);
              onSuccess?.();
            } catch (e) {
              console.error("Google login error:", e);
            }
          },
        });
        initializedRef.current = true;
      }

      btnRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        logo_alignment: "left",
        text: "signin_with",
      });
      renderedRef.current = true;
    };

    if (window.google?.accounts?.id) {
      initAndRender();
    } else {
      const onLoaded = () => initAndRender();
      window.addEventListener("gsi_loaded", onLoaded);

      const iv = window.setInterval(() => {
        if (window.google?.accounts?.id && !renderedRef.current) {
          initAndRender();
          window.clearInterval(iv);
        }
      }, 100);

      return () => {
        window.removeEventListener("gsi_loaded", onLoaded);
        window.clearInterval(iv);
      };
    }
  }, [loginGoogle, onSuccess, clientId]);

  return (
    <div className="w-full flex justify-center">
      <div ref={btnRef} data-testid="google-btn" />
    </div>
  );
}
