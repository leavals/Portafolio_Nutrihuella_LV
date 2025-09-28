// src/components/ProtectedPage.tsx
"use client";

import { useAuth } from "@/lib/auth-context";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import ComingSoonPage from "@/components/ComingSoonPage"; // opcional, ver UNDER_CONSTRUCTION

const PUBLIC_PATHS = new Set<string>(["/", "/login", "/register"]);

// (Opcional) marca rutas "en construcción"
const UNDER_CONSTRUCTION = new Set<string>([
  // "/recipes/favorites",
]);

export default function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const sp = useSearchParams();

  const isPublic = useMemo(() => PUBLIC_PATHS.has(pathname), [pathname]);
  const isComingSoon = useMemo(() => UNDER_CONSTRUCTION.has(pathname), [pathname]);

  if (loading) return null;

  // Páginas públicas pasan siempre
  if (isPublic) return <>{children}</>;

  // Si marcaste esta ruta como "en construcción"
  if (isComingSoon) {
    return <ComingSoonPage />;
  }

  // Páginas privadas sin sesión → cartel + ir a login (full navigation)
  if (!isAuthenticated) {
    const next = pathname + (sp.toString() ? `?${sp.toString()}` : "");
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="p-6 bg-white rounded-xl shadow-md text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Acceso no autorizado
          </h2>
        <p className="text-gray-600 mb-4">Debes iniciar sesión para ver esta página.</p>
          <button
            onClick={() =>
              window.location.assign(`/login?next=${encodeURIComponent(next)}`)
            }
            className="btn btn-primary"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  // Autenticado → render normal
  return <>{children}</>;
}
