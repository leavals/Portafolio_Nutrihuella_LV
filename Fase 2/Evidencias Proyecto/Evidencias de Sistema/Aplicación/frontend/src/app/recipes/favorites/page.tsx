// src/app/recipes/favorites/page.tsx
'use client';
/**
 * Listado de recetas favoritas del usuario.
 * - Carga desde /api/recipes/favorites.
 * - Permite eliminar un favorito.
 */
import { useEffect, useState } from 'react';
import { FavoriteRecipe, getFavorites, removeFavorite } from '@/services/recipes';

export default function FavoritesPage() {
  const [items, setItems] = useState<FavoriteRecipe[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getFavorites();
      setItems(data);
    } catch (e: any) {
      setError(e?.message || 'No fue posible cargar tus recetas favoritas.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onRemove(id: string) {
    setRemoving(id);
    setError(null);
    try {
      await removeFavorite(id);
      setItems((prev) => (prev ?? []).filter((x) => x.id !== id));
    } catch (e: any) {
      setError(e?.message || 'No fue posible eliminar el favorito.');
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-ink">Recetas favoritas</h1>
        <p className="text-sm text-muted">Tus menús guardados para volver a usarlos cuando quieras.</p>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border bg-[#FEF2F2] border-[#EF4444]/30 text-[#991B1B] px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card">Cargando…</div>
      ) : items && items.length === 0 ? (
        <div className="card">
          <p className="text-sm">Aún no tienes recetas favoritas. Guarda una desde el generador.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {(items ?? []).map((fav) => {
            const r = fav.recipe || {};
            const title = fav.title || r.title || 'Receta';
            const plan = fav.planType || r.planType || '';
            const meals = Array.isArray(r.meals) ? r.meals : [];
            return (
              <li key={fav.id} className="card">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-ink">{title}</h2>
                    <p className="text-xs text-muted">
                      {plan ? `${plan} • ` : ''}{new Date(fav.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    className="btn btn-outline"
                    onClick={() => onRemove(fav.id)}
                    disabled={removing === fav.id}
                    aria-label="Eliminar favorito"
                    title="Eliminar favorito"
                  >
                    {removing === fav.id ? 'Eliminando…' : 'Eliminar'}
                  </button>
                </div>

                {meals.length > 0 && (
                  <div className="mt-3 grid md:grid-cols-2 gap-3">
                    {meals.slice(0, 4).map((m: any, i: number) => (
                      <div key={i} className="rounded-lg border p-3">
                        <p className="text-sm font-semibold text-ink">
                          {m.name}{m.kcal ? ` • ${m.kcal} kcal` : ''}
                        </p>
                        {Array.isArray(m.ingredients) && m.ingredients.length > 0 && (
                          <ul className="list-disc ml-5 mt-1 text-sm">
                            {m.ingredients.slice(0, 3).map((ing: any, j: number) => (
                              <li key={j}>
                                {ing.name}
                                {ing.qty || ing.unit ? `: ${ing.qty ?? ''}${ing.unit ?? ''}` : ''}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
