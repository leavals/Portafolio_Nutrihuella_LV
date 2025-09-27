import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "NutriHuella",
  description: "Alimentación natural personalizada para tu mascota",
};

export default function RootLayout({
  children,
  modal, // ⬅️ slot paralelo para modales
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Providers>
          {/* Fondo */}
          <div
            className="fixed inset-0 -z-10 bg-center bg-cover"
            style={{
              backgroundImage:
                "url('/nutrihuella/dog-bg.png')",
            }}
          />
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>

          {/* Aquí se montan los modales (si hay) */}
          {modal}
        </Providers>
      </body>
    </html>
  );
}
