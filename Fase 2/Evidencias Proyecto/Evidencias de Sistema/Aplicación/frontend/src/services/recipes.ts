// src/services/recipes.ts
'use client';
/**
 * Servicios de recetas: generación, favoritos y feedback.
 * - generateRecipe: llama al backend y normaliza la respuesta.
 * - addFavorite: guarda una receta en favoritos.
 * - getFavorites: lista favoritos del usuario.
 * - removeFavorite: elimina un favorito propio.
 * - sendFeedback: califica una receta generada.
 */
import api from '@/lib/api';

export type PlanType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'DAILY' | 'WEEKLY';

export async function generateRecipe(payload: {
  petId: string;
  planType: PlanType;
  goals?: string;
  usePantry?: boolean;
}) {
  // Enviamos alias defensivos para máxima compatibilidad con el backend
  const body = {
    petId: payload.petId,
    pet_id: payload.petId,
    planType: payload.planType,
    plan_type: payload.planType,
    mealType: payload.planType,
    meal: payload.planType,
    usePantry: !!payload.usePantry,
    use_pantry: !!payload.usePantry,
    goals: payload.goals || undefined,
    goal: payload.goals || undefined,
    constraints: payload.goals || undefined,
  };

  console.log('[recipes.generate] POST /api/recipes/generate', body);
  const data = await api.post<any>('/api/recipes/generate', body);

  // Normalización defensiva
  const recipe   = data?.recipe ?? data?.data ?? data;
  const recipeId = data?.recipeId ?? data?.id ?? null;
  return { recipe, recipeId };
}

/** Crea un favorito en backend. Admite enviar {recipe} o {recipeId}. */
export async function addFavorite(params: { recipeId?: string; recipe?: any; title?: string; planType?: PlanType; petId?: string }) {
  return api.post<{ id: string }>('/api/recipes/favorites', params);
}

/** Obtiene favoritos del usuario autenticado. */
export type FavoriteRecipe = {
  id: string;
  title?: string | null;
  planType?: PlanType | null;
  createdAt: string;
  recipe: any; // contenido JSON ya parseado
};
export async function getFavorites(): Promise<FavoriteRecipe[]> {
  const list = await api.get<any[]>('/api/recipes/favorites');
  // Garantizamos shape estable: {id, title, planType, createdAt, recipe}
  return (Array.isArray(list) ? list : []).map((row) => ({
    id: row?.id,
    title: row?.title ?? null,
    planType: row?.planType ?? null,
    createdAt: row?.createdAt ?? row?.created_at ?? new Date().toISOString(),
    recipe: row?.recipe ?? row?.content ?? row?.contentJson ?? row, // fallback
  }));
}

/** Elimina un favorito propio. */
export async function removeFavorite(id: string): Promise<void> {
  await api.delete(`/api/recipes/favorites/${encodeURIComponent(id)}`);
}

/** Feedback simple (👍/👎) sobre una receta generada. */
export async function sendFeedback(recipeId: string, vote: -1 | 1) {
  return api.post(`/api/recipes/${encodeURIComponent(recipeId)}/feedback`, { vote });
}
