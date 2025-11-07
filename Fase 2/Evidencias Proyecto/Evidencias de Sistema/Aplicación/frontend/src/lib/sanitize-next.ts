"use client";

const UNSAFE_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/plus/success",
];

export function sanitizeNext(next?: string | null): string {
  if (!next) return "/";
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const u = new URL(next, base);
    const p = u.pathname;

    // Evita volver a rutas que reabren modales o bucles
    if (
      p.startsWith("/@modal") ||
      p.includes("login-success") ||
      UNSAFE_PATHS.some((bad) => p === bad)
    ) {
      return "/";
    }

    // Permite query/hash
    const composed = `${u.pathname}${u.search}${u.hash}`;
    return composed || "/";
  } catch {
    return "/";
  }
}
