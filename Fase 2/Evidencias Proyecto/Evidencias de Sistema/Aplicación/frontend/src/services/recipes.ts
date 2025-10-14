// src/services/recipes.ts
'use client';
import api from '@/lib/api';

export type PlanType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'DAILY' | 'WEEKLY';

export async function generateRecipe(payload: {
  petId: string;
  planType: PlanType;
  goals?: string;
  usePantry?: boolean;
}) {
  // Mandamos alias de nombres para maximizar compatibilidad con el backend
  const body = {
    // id mascota
    petId: payload.petId,
    pet_id: payload.petId,

    // tipo de plan / comida
    planType: payload.planType,
    plan_type: payload.planType,
    mealType: payload.planType,
    meal: payload.planType,

    // usar despensa
    usePantry: !!payload.usePantry,
    use_pantry: !!payload.usePantry,

    // objetivos / restricciones (3 alias comunes)
    goals: payload.goals || undefined,
    goal: payload.goals || undefined,
    constraints: payload.goals || undefined,
  };

  console.log('[recipes.generate] POST /api/recipes/generate', body);
  const data = await api.post<any>('/api/recipes/generate', body);

  // normalización defensiva
  const recipe   = data?.recipe ?? data?.data ?? data;
  const recipeId = data?.recipeId ?? data?.id ?? null;
  return { recipe, recipeId };
}

export async function addFavorite(params: { recipeId?: string; recipe?: any }) {
  return api.post('/api/recipes/favorites', params);
}

export async function sendFeedback(recipeId: string, vote: -1 | 1) {
  return api.post(`/api/recipes/${recipeId}/feedback`, { vote });
}
