// src/components/GoogleGsiScript.tsx
"use client";

import Script from "next/script";

export default function GoogleGsiScript() {
  return (
    <Script
      id="google-gsi"
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={() => {
        // Avisamos al resto de la app que GSI ya está listo
        try {
          window.dispatchEvent(new Event("gsi_loaded"));
        } catch {
          // no-op
        }
      }}
    />
  );
}
