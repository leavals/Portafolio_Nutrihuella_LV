// src/app/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Dog, Utensils, Package, Plus } from 'lucide-react';

// Importa tu servicio de favoritos (ya existe en tu proyecto)
import type { FavoriteRecipe } from '@/services/recipes';
import { getFavorites } from '@/services/recipes';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  // ---- Estado para favoritos (solo se usa cuando está autenticado) ----
  const [favorites, setFavorites] = useState<FavoriteRecipe[] | null>(null);
  const [favLoading, setFavLoading] = useState(false);
  const [favError, setFavError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      setFavLoading(true);
      setFavError(null);
      try {
        const data = await getFavorites();
        setFavorites(Array.isArray(data) ? data : []);
      } catch (err) {
        setFavError('No se pudieron cargar tus recetas favoritas.');
        setFavorites([]);
      } finally {
        setFavLoading(false);
      }
    })();
  }, [isAuthenticated]);

  // --- Landing PÚBLICO (usuario no logueado) ---
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Card principal del hero */}
        <section className="flex justify-center">
          <div className="w-full max-w-3xl bg-white border border-[--nh-border] rounded-2xl shadow p-6 sm:p-8 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-ink">
              NutriHuella
            </h1>

            {/* LOGO debajo del título */}
            <Image
              src="/nutrihuella/logo-mark.png"
              alt="Logo de NutriHuella"
              width={96}
              height={96}
              className="mx-auto mt-3"
              priority
            />

            <p className="mt-4 text-lg text-muted">
              Alimentación natural personalizada para tu mascota. Crea su perfil,
              gestiona tu despensa y genera recetas equilibradas en segundos.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register" className="btn btn-primary">
                Crear cuenta gratis
              </Link>
              <Link href="/login" className="btn btn-outline-primary">
                Iniciar sesión
              </Link>
            </div>
          </div>
        </section>

        {/* Beneficios / features */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="glass border border-[--nh-border] rounded-2xl p-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow">
              <Dog className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="font-semibold text-ink">Perfil de tu mascota</h3>
            <p className="text-sm text-muted mt-2">
              Registra edad, peso y necesidades para personalizar las recetas.
            </p>
          </div>

          <div className="glass border border-[--nh-border] rounded-2xl p-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow">
              <Package className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="font-semibold text-ink">Tu despensa</h3>
            <p className="text-sm text-muted mt-2">
              Carga los alimentos que tienes y evítate salidas innecesarias.
            </p>
          </div>

          <div className="glass border border-[--nh-border] rounded-2xl p-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow">
              <Utensils className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="font-semibold text-ink">Recetas al instante</h3>
            <p className="text-sm text-muted mt-2">
              Genera menús equilibrados con IA adaptados a tu mascota.
            </p>
          </div>
        </section>
      </div>
    );
  }

  // --- Landing AUTENTICADO (usuario logueado) ---
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Saludo en CARD blanca */}
      <header className="mb-6">
        <div className="rounded-2xl bg-white border border-[--nh-border] shadow p-6">
          <h1 className="text-3xl font-bold text-ink">
            {user?.name ? `¡Hola, ${user.name.split(' ')[0]}!` : '¡Hola!'}
          </h1>
          <p className="text-muted">
            ¿Qué te gustaría hacer hoy? Aquí tienes accesos rápidos.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna izquierda: acciones principales */}
        <aside className="self-start rounded-2xl glass p-6 lg:p-8 border border-[--nh-border]">
          <div className="mx-auto w-full max-w-xl space-y-5">
            {/* Generar receta */}
            <section className="card p-6 shadow text-center">
              <h2 className="text-2xl font-semibold text-ink">Generar receta</h2>
              <p className="mt-2 text-sm text-muted">
                Crea una dieta personalizada usando los alimentos de tu despensa.
              </p>
              <Link
                href="/recipes/generator"
                className="mt-4 btn btn-primary mx-auto inline-flex items-center gap-2"
              >
                <Utensils className="h-5 w-5" aria-hidden />
                Generar receta
              </Link>
            </section>

            {/* Despensa */}
            <section className="card p-6 shadow text-center">
              <h2 className="text-2xl font-semibold text-ink">Mi despensa</h2>
              <p className="mt-2 text-sm text-muted">
                Administra los ingredientes que tienes disponibles en casa.
              </p>
              <Link
                href="/pantry"
                className="mt-4 btn btn-accent mx-auto inline-flex items-center gap-2"
              >
                <Package className="h-5 w-5" aria-hidden />
                Ver despensa
              </Link>
            </section>

            {/* Agregar mascota */}
            <section className="card p-6 shadow text-center">
              <h2 className="text-2xl font-semibold text-ink">Agregar mascota</h2>
              <p className="mt-2 text-sm text-muted">
                Registra a tu mascota para personalizar sus planes y seguimientos.
              </p>
              <Link
                href="/pets"
                className="mt-4 btn btn-outline-primary mx-auto inline-flex items-center gap-2 border-2 rounded-lg"
              >
                <Plus className="h-5 w-5" aria-hidden />
                Añadir mascota
              </Link>
            </section>
          </div>
        </aside>

        {/* Columna derecha: FAVORITAS */}
        <section className="rounded-2xl glass p-6 lg:p-8 border border-[--nh-border]">
          <div className="rounded-xl bg-white border border-[--nh-border] shadow p-6 lg:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-semibold text-ink">Tus recetas favoritas</h2>
              <Link href="/recipes/favorites" className="btn btn-outline-primary">
                Ver todas
              </Link>
            </div>

            {/* Contenido según estado */}
            <div className="mt-6">
              {favLoading && (
                <ul className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <li
                      key={i}
                      className="rounded-lg border border-[--nh-border] p-4 animate-pulse"
                    >
                      <div className="h-4 w-1/3 bg-gray-200 rounded mb-2" />
                      <div className="h-3 w-2/3 bg-gray-100 rounded" />
                    </li>
                  ))}
                </ul>
              )}

              {!favLoading && favError && (
                <p className="text-sm text-red-600">{favError}</p>
              )}

              {!favLoading && !favError && (favorites?.length ?? 0) > 0 && (
                <ul className="space-y-4">
                  {(favorites ?? []).slice(0, 3).map((fav, idx) => {
                    const title =
                      // intenta distintos campos comunes
                      (fav as any).title ??
                      (fav as any).name ??
                      (fav as any).recipe?.title ??
                      (fav as any).recipe?.name ??
                      `Receta ${idx + 1}`;

                    return (
                      <li
                        key={(fav as any).id ?? `${title}-${idx}`}
                        className="flex items-start justify-between rounded-lg border border-[--nh-border] p-4"
                      >
                        <div>
                          <p className="font-medium text-ink">{title}</p>
                          <p className="text-sm text-muted">
                            Marcada como favorita
                          </p>
                        </div>
                        <Link
                          href="/recipes/favorites"
                          className="btn btn-outline-primary"
                        >
                          Ver
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}

              {!favLoading && !favError && (favorites?.length ?? 0) === 0 && (
                <div className="rounded-lg border border-dashed border-[--nh-border] p-6 text-center">
                  <p className="text-ink font-medium">
                    Aún no agregaste ninguna receta favorita.
                  </p>
                  <p className="text-sm text-muted mt-1">
                    Genera una receta y márcala como favorita para verla aquí.
                  </p>
                  <Link
                    href="/recipes/generator"
                    className="mt-4 inline-flex items-center gap-2 btn btn-primary"
                  >
                    <Utensils className="h-5 w-5" aria-hidden />
                    Generar receta
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
