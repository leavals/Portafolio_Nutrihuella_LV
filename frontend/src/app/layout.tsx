import type { Metadata } from "next";
import AuthProvider from "@/lib/auth-context";

export const metadata: Metadata = { title: "NutriHuella" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
