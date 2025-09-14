"use client";

// Envoltorio de proveedores de la app.
// Aquí puedes agregar más providers en el futuro (theme, i18n, etc.)
import AuthProvider from "@/lib/auth-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
