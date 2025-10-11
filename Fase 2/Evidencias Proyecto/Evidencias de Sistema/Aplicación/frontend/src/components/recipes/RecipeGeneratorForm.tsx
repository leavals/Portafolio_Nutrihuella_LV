'use client';
import React from 'react';
import { generateRecipe, addFavorite, sendFeedback, PlanType } from '@/services/recipes';
import api from '@/lib/api';
import RecipeCard from './RecipeCard';

type PetApi = any;
type Pet = { id: string; name: string; species?: string; breed?: string };

function normalizePets(apiPets: PetApi[]): Pet[] {
  return (apiPets || []).map((p: any) => {
    const id = p.id ?? p._id ?? p.uuid ?? p.petId ?? p.externalId ?? '';
    return {
      id: String(id),
      name: p.name ?? p.nombre ?? 'Mascota',
      species: p.species ?? p.especie ?? undefined,
      breed: p.breed ?? p.raza ?? undefined,
    };
  }).filter(p => !!p.id);
}

export default function RecipeGeneratorForm() {
  const [pets, setPets] = React.useState<Pet[]>([]);
  const [petId, setPetId] = React.useState<string>('');
  const [planType, setPlanType] = React.useState<PlanType>('LUNCH');
  const [goals, setGoals] = React.useState<string>('');
  const [usePantry, setUsePantry] = React.useState<boolean>(true);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [recipeId, setRecipeId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Cargar mascotas del usuario desde el backend (:4000)
  React.useEffect(() => {
    (async () => {
      try {
        const data = await api.get<any>('/api/pets');
        const list = Array.isArray(data) ? data : (data?.items ?? data?.data ?? []);
        const normalized = normalizePets(list);
        setPets(normalized);
        if (normalized.length) setPetId(prev => prev || normalized[0].id);
        if (!normalized.length) console.warn('[RecipeGenerator] No se encontraron mascotas en /api/pets');
      } catch (e) {
        console.error('[RecipeGenerator] Error cargando mascotas', e);
      }
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!petId) {
      setError('Debes seleccionar una mascota.');
      return;
    }

    setLoading(true);
    try {
      const { recipe, recipeId } = await generateRecipe({
        petId,
        planType,
        goals: goals?.trim() || undefined,
        usePantry,
      });
      setResult(recipe);
      setRecipeId(recipeId ?? null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('[RecipeGenerator] generate failed', err);
      setError(err?.message ?? 'No fue posible generar la receta.');
    } finally {
      setLoading(false);
    }
  }

  async function onFavorite() {
    try {
      await addFavorite({ recipeId: recipeId ?? undefined, recipe: recipeId ? undefined : result });
      alert('Guardado en favoritos');
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'No se pudo guardar en favoritos');
    }
  }

  async function onFeedback(vote: -1 | 1) {
    if (!recipeId) return alert('Primero guarda o genera una receta para asociar feedback.');
    try {
      await sendFeedback(recipeId, vote);
      alert('¡Gracias por tu feedback!');
    } catch {
      alert('No se pudo registrar el feedback');
    }
  }

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {result && (
        <RecipeCard data={result} onFavorite={onFavorite} onFeedback={onFeedback} />
      )}

      <form onSubmit={onSubmit} className="w-full max-w-3xl bg-white rounded-xl shadow p-5 border border-emerald-900/10">
        <h1 className="text-2xl font-extrabold text-[#10776F]">Generador de Recetas</h1>
        <p className="text-sm text-gray-600 mt-1">
          Genera menús personalizados en base a la ficha de tu mascota y tu despensa.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <div>
            <label className="text-sm font-semibold text-[#10776F]">Mascota</label>
            <select value={petId} onChange={e => setPetId(e.target.value)} className="w-full border rounded-lg p-2">
              {pets.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-[#10776F]">Comida / Plan</label>
            <select value={planType} onChange={e => setPlanType(e.target.value as PlanType)} className="w-full border rounded-lg p-2">
              <option value="BREAKFAST">Desayuno</option>
              <option value="LUNCH">Almuerzo</option>
              <option value="DINNER">Cena</option>
              <option value="DAILY">Menú Diario</option>
              <option value="WEEKLY">Menú Semanal</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-[#10776F]">Objetivos / Restricciones</label>
            <textarea
              value={goals}
              onChange={e => setGoals(e.target.value)}
              rows={3}
              className="w-full border rounded-lg p-2"
              placeholder="Ej: bajar de peso, reforzar vitaminas, evitar pollo..."
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <input id="usepantry" type="checkbox" checked={usePantry} onChange={e => setUsePantry(e.target.checked)} />
            <label htmlFor="usepantry" className="text-sm">Usar ingredientes de mi despensa</label>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button type="submit" disabled={loading || !petId} className="px-4 py-2 bg-[#10776F] text-white rounded-lg font-semibold">
            {loading ? 'Generando…' : 'Generar receta'}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Estos resultados son solo de referencia y no deben tratarse como base para un tratamiento médico o para determinar las condiciones de salud.
        </p>

        {error && <p className="text-sm text-rose-700 mt-3">Error: {error}</p>}
      </form>
    </div>
  );
}
