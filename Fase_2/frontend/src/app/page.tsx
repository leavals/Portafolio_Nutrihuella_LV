// frontend/src/app/page.tsx
"use client";
import Link from "next/link";

export default function Home(){
  return (
    <>
      <section className="card bg-[var(--nh-cream)] border border-amber-100">
        <h1 className="text-3xl font-bold mb-2">NutriHuella</h1>
        <p className="text-slate-600 mb-6">
          Alimentación natural personalizada para tu mascota. Registra su ficha clínica, vacunas y controles.
        </p>
        <div className="flex gap-3">
          <Link href="/register" className="btn btn-primary">Crear cuenta</Link>
          <Link href="/login" className="btn btn-outline">Iniciar sesión</Link>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-4 mt-8">
        {[
          { t: "Ficha clínica", d: "Historia, alergias, tratamientos" },
          { t: "Mascotas", d: "Registra y gestiona tus compañeros" },
          { t: "Vacunas", d: "Aplicaciones y recordatorios" },
        ].map((c) => (
          <div key={c.t} className="card">
            <h3 className="text-lg font-semibold">{c.t}</h3>
            <p className="text-sm text-slate-600">{c.d}</p>
          </div>
        ))}
      </section>
    </>
  );
}
