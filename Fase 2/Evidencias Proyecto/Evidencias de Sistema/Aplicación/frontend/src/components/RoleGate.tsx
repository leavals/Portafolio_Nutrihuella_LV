"use client";

/**
 * RoleGate
 * - Restringe el acceso a los hijos según el role del usuario o flags isAdmin/isAnalyst
 * - Soporta roles: "ADMIN", "ANALYST", "USER" (o ausencia de role => cliente)
 */
import { useAuth } from "@/lib/auth-context";

type Props = {
  allow?: Array<"ADMIN" | "ANALYST" | "USER">;
  requireAdmin?: boolean;
  requireAnalyst?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export default function RoleGate({
  allow,
  requireAdmin = false,
  requireAnalyst = false,
  children,
  fallback,
}: Props) {
  const { role, isAdmin } = useAuth();

  const normalized = (role || "").toUpperCase();
  const isAnalyst = normalized === "ANALYST";

  if (requireAdmin && !isAdmin) return fallback ?? <Default403 />;
  if (requireAnalyst && !isAnalyst && !isAdmin) return fallback ?? <Default403 />;

  if (allow && allow.length > 0) {
    const allowSet = new Set(allow.map((r) => r.toUpperCase()));
    if (!allowSet.has(normalized) && !(isAdmin && allowSet.has("ADMIN")))
      return fallback ?? <Default403 />;
  }

  return <>{children}</>;
}

function Default403() {
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-red-600 mb-2">Acceso restringido</h2>
      <p className="text-gray-700">
        No cuentas con permisos para ver este contenido.
      </p>
    </div>
  );
}
