// frontend/src/app/layout.tsx
// Layout raíz del App Router. Importa estilos globales, envuelve con AuthProvider
// y renderiza el Navbar en TODAS las páginas (una sola vez).

import type { Metadata } from "next";
import "./../styles/globals.css";
import Navbar from "@/components/Navbar";
import AuthProvider from "@/lib/auth-context"; // 👈 proveedor de sesión (client component)

export const metadata: Metadata = {
  title: "NutriHuella",
  description: "Alimentación natural personalizada para tu mascota",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL">
      <body className="min-h-screen bg-[var(--nh-cream)] text-[var(--nh-ink)] antialiased">
        {/* 👇 Proveedor de autenticación envuelve TODO */}
        <AuthProvider>
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-500">
            © {new Date().getFullYear()} NutriHuella — Proyecto académico.
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
