'use client';

/**
 * Generador de recetas (página del flujo clásico).
 * - Se eliminan los alert() al guardar favoritos. El feedback lo muestra RecipeView.
 * - onAddFavorite ahora devuelve Promise<boolean> y propaga errores si falla.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import type { Pet } from '@/types/pet';
import type { RecipePlan } from '@/types/recipe';
import RecipeView from '@/components/recipes/RecipeView';

/* -------------------------------------------------------------
   Util: parsea/normaliza la respuesta para evitar mostrar JSON crudo
-------------------------------------------------------------- */
function safeParseRecipe(raw: any): RecipePlan | null {
  if (!raw) return null;
  if (typeof raw === 'object') return normalize(raw);

  let text = String(raw).trim();
  text = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const s = text.indexOf('{');
  const e = text.lastIndexOf('}');
  if (s !== -1 && e !== -1) text = text.slice(s, e + 1);
  try { return normalize(JSON.parse(text)); } catch { return null; }

  function normalize(o: any): RecipePlan {
    return {
      title: o.title ?? 'Plan de comida',
      goal: o.goal ?? o.objective ?? undefined,
      constraints: o.constraints ?? o.restrictions ?? undefined,
      meals: (o.meals ?? o.menu ?? []).map((m: any) => ({
        name: m.name ?? m.title ?? 'Comida',
        items: m.items ?? m.ingredients ?? [],
      })),
      disclaimer: o.disclaimer ?? undefined,
    };
  }
}

/* -------------------------------------------------------------
   Página
-------------------------------------------------------------- */
export default function RecipeGeneratorPage() {
  const { isAuthenticated } = useAuth();

  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(false);

  // Campos del formulario (versión completa)
  const [petId, setPetId] = useState<string>('');
  const [goal, setGoal] = useState('bajar de peso');
  const [constraints, setConstraints] = useState('');
  const [include, setInclude] = useState('arroz integral, zanahoria');
  const [exclude, setExclude] = useState('pollo alto en fibra');
  const [mealsPerDay, setMealsPerDay] = useState<number>(2);
  const [targetCalories, setTargetCalories] = useState<number | ''>('');

  // Estado de generación
  const [genLoading, setGenLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<RecipePlan | null>(null);

  // Guardado favoritos
  const [saving, setSaving] = useState(false);

  // Carga mascotas (requiere auth)
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      setLoadingPets(true);
      try {
        const data = await api.get<Pet[]>('/api/pets');
        setPets(data || []);
        if (!petId && data?.length) setPetId(data[0].id);
      } catch (e: any) {
        setError(e?.message || 'No se pudieron cargar tus mascotas');
      } finally {
        setLoadingPets(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const selectedPet = useMemo(() => pets.find(p => p.id === petId) || null, [pets, petId]);
  selectedPet; // silenciar TS si no lo usas aún

  async function generate() {
    setError(null);
    setPlan(null);
    setGenLoading(true);
    try {
      // Compatibilidad: el backend acepta { goal, constraints }.
      // Se envían campos extra, que puede ignorar si no los usa.
      const payload = {
        petId: petId || undefined,
        goal: goal || undefined,
        constraints: constraints || exclude || undefined,
        include: include || undefined,
        exclude: exclude || undefined,
        mealsPerDay: mealsPerDay || undefined,
        targetCalories: targetCalories || undefined,
      };

      const res = await api.post<any>('/api/recipes/generate', payload);
      const parsed = safeParseRecipe(res?.plan ?? res);
      if (!parsed) throw new Error('No se pudo interpretar la respuesta del modelo.');
      setPlan(parsed);
    } catch (e: any) {
      setError(e?.message || 'Error generando receta');
    } finally {
      setGenLoading(false);
    }
  }

  /**
   * Guardar en favoritos SIN alert().
   * Devuelve true al éxito. En error, lanza para que el consumidor pueda notificar.
   */
  async function addFavorite(): Promise<boolean> {
    if (!plan) return false;
    setSaving(true);
    try {
      await api.post('/api/recipes/favorites', { plan, petId: petId || undefined });
      return true;
    } catch (e: any) {
      // Propagamos el error para que RecipeView pueda mostrar su aviso
      throw (e instanceof Error ? e : new Error('No se pudo guardar'));
    } finally {
      setSaving(false);
    }
  }

  // Si no hay sesión → mensaje claro
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          No has iniciado sesión. Inicia sesión para usar el generador.{' '}
          <Link href="/login" className="underline">Ir a iniciar sesión</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      {/* Contenedor translúcido sobre la imagen de fondo */}
      <div className="rounded-2xl border bg-white/70 backdrop-blur p-4 md:p-6">
        <h1 className="text-xl md:text-2xl font-semibold">Generador de Recetas</h1>

        {/* Formulario completo */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {/* Mascota */}
          <label className="grid gap-1">
            <span className="text-sm text-slate-600">Mascota</span>
            <select
              className="rounded-xl border px-3 py-2"
              value={petId}
              onChange={(e) => setPetId(e.target.value)}
              disabled={loadingPets || !pets.length}
            >
              {pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.breed ? `• ${p.breed}` : ''} {p.weight_kg ? `• ${p.weight_kg}kg` : ''}
                </option>
              ))}
            </select>
            {!pets.length && !loadingPets && (
              <span className="text-xs text-slate-500">
                No tienes mascotas registradas. Ve a <Link href="/pets" className="underline">Mis mascotas</Link>.
              </span>
            )}
          </label>

          {/* Objetivo */}
          <label className="grid gap-1">
            <span className="text-sm text-slate-600">Objetivo</span>
            <input
              className="rounded-xl border px-3 py-2"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="bajar de peso / mantenimiento / etc."
            />
          </label>

          {/* Incluir ingredientes */}
          <label className="grid gap-1">
            <span className="text-sm text-slate-600">Incluir (separado por comas)</span>
            <input
              className="rounded-xl border px-3 py-2"
              value={include}
              onChange={(e) => setInclude(e.target.value)}
              placeholder="arroz, zanahoria, …"
            />
          </label>

          {/* Excluir / restricciones */}
          <label className="grid gap-1">
            <span className="text-sm text-slate-600">Restringir / Excluir (separado por comas)</span>
            <input
              className="rounded-xl border px-3 py-2"
              value={exclude}
              onChange={(e) => setExclude(e.target.value)}
              placeholder="pollo alto en fibra, …"
            />
          </label>

          {/* Comidas por día */}
          <label className="grid gap-1">
            <span className="text-sm text-slate-600">Comidas por día</span>
            <input
              type="number"
              min={1}
              className="rounded-xl border px-3 py-2"
              value={mealsPerDay}
              onChange={(e) => setMealsPerDay(parseInt(e.target.value || '0', 10))}
            />
          </label>

          {/* Calorías objetivo (opcional) */}
          <label className="grid gap-1">
            <span className="text-sm text-slate-600">Calorías objetivo (kcal) — opcional</span>
            <input
              type="number"
              min={0}
              className="rounded-xl border px-3 py-2"
              value={targetCalories}
              onChange={(e) =>
                setTargetCalories(e.target.value === '' ? '' : parseInt(e.target.value || '0', 10))
              }
              placeholder="ej. 450"
            />
          </label>

          {/* Comentarios / constraints extra */}
          <label className="md:col-span-2 grid gap-1">
            <span className="text-sm text-slate-600">Comentarios / Restricciones adicionales</span>
            <textarea
              className="rounded-xl border px-3 py-2 min-h-20"
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="alergias, presupuesto, texturas preferidas, etc."
            />
          </label>
        </div>

        <div className="mt-4">
          <button
            onClick={generate}
            disabled={genLoading || (pets.length > 0 && !petId)}
            className="px-4 py-2 rounded-xl bg-[--nh-primary] text-white hover:opacity-90 disabled:opacity-60"
          >
            {genLoading ? 'Generando…' : 'Generar receta'}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Resultado */}
      {plan && (
        <RecipeView
          plan={plan}
          onAddFavorite={addFavorite}  // ya no muestra alert(); RecipeView gestiona el banner
          adding={saving}
        />
      )}
    </div>
  );
}
