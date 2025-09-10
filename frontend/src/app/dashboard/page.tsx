"use client";

import { useEffect, useState } from "react";

/**
 * Pantalla protegida: consulta /api/auth/me con el JWT guardado.
 * Si falla, muestra error. Si pasa, saluda al usuario.
 */
export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("nh_token");
    if (!token) { setError("No autenticado"); return; }

    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("No autorizado");
        return r.json();
      })
      .then(setProfile)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <main className="container-nh py-16">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-4 text-nh-coral">Error: {error}</p>
        <p className="mt-2">
          <a className="btn-secondary" href="/">Volver al inicio</a>
        </p>
      </main>
    );
  }

  if (!profile) return <main className="container-nh py-16">Cargando…</main>;

  return (
    <main className="container-nh py-16">
      <h1 className="text-3xl font-bold">¡Hola, {profile.name ?? profile.email}!</h1>
      <p className="mt-2 text-nh-gray">Tu sesión está activa.</p>
      <div className="mt-6">
        <a className="btn-primary" href="#">Ir a Ficha Clínica</a>
      </div>
    </main>
  );
}
