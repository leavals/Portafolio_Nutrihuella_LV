"use client";

import Navbar from "@/components/Navbar";
import GoogleLogin from "@/components/GoogleLogin";
import { useRouter } from "next/navigation";

/**
 * Home con Hero, secciones de funciones y bloque de login con Google.
 * Visualmente busca ser lo más parecido a tu captura.
 */
export default function Home() {
  const router = useRouter();

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="bg-nh-bg">
        <div className="container-nh py-14 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-nh-teal">
              Alimentación saludable <br /> para tu perro
            </h1>
            <p className="mt-6 text-lg text-nh-gray max-w-xl">
              Planes nutricionales personalizados y recetas caseras para perros,
              nutritivas y seguras.
            </p>

            <div className="mt-8 flex items-center gap-4">
              <a className="btn-primary" href="#login">Empezar</a>
            </div>
          </div>

          <div className="relative">
            {/* Ilustración temporal */}
            <div className="w-full h-80 rounded-3xl bg-nh-teal/10 grid place-items-center">
              <span className="text-7xl">🐶</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-y border-black/5">
        <div className="container-nh py-14 grid md:grid-cols-3 gap-10">
          <Feature
            title="Ficha Clínica de Mascota"
            desc="Registra y actualiza la información médica de tu perro."
            icon="👤"
          />
          <Feature
            title="Generador de Plan Nutricional"
            desc="Crea un plan natural adaptado a sus necesidades."
            icon="🧪"
          />
          <Feature
            title="Explora Recetas"
            desc="Descubre y comparte recetas saludables para tu perro."
            icon="🍲"
          />
        </div>
      </section>

      {/* Login con Google */}
      <section id="login" className="bg-nh-cream">
        <div className="container-nh py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-nh-dark">
            Inicia sesión para guardar planes y recetas
          </h2>
          <p className="mt-2 text-nh-gray">
            Accede con tu cuenta de Google. Seguro y rápido.
          </p>

          <div className="mt-8 flex justify-center">
            <GoogleLogin
              onSuccess={() => {
                // Token ya quedó guardado en localStorage
                router.push("/dashboard");
              }}
            />
          </div>
        </div>
      </section>
    </>
  );
}

function Feature({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="text-4xl">{icon}</div>
      <div>
        <h3 className="text-xl font-semibold text-nh-dark">{title}</h3>
        <p className="text-nh-gray mt-1">{desc}</p>
      </div>
    </div>
  );
}
