import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NutriHuella",
  description: "Alimentación natural personalizada para tu perro",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
