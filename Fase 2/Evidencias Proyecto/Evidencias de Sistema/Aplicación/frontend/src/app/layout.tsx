// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Providers from "./providers";
import ProtectedPage from "@/components/ProtectedPage";
import RecipeLoadingOverlay from "@/components/RecipeLoadingOverlay";
import GoogleGsiScript from "@/components/GoogleGsiScript"; // ⬅️ nuevo

export const metadata: Metadata = {
  title: "NutriHuella",
  description: "Alimentación natural personalizada para tu mascota",
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {/* Carga única de GSI desde un Client Component */}
        <GoogleGsiScript />

        <Providers>
          {/* Fondo */}
          <div
            className="fixed inset-0 -z-10 bg-center bg-cover"
            style={{ backgroundImage: "url('/nutrihuella/dog-bg.png')" }}
          />

          <Navbar />

          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            {/* Protege globalmente todas las rutas (menos /, /login, /register) */}
            <ProtectedPage>{children}</ProtectedPage>
          </main>

          {/* Slot de modales */}
          {modal}

          <RecipeLoadingOverlay />
        </Providers>
      </body>
    </html>
  );
}
