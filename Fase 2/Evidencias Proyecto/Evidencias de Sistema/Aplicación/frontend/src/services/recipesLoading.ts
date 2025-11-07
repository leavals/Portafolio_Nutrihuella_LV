'use client';

import { apiWithSignal } from '@/lib/api-with-signal';
import type { PlanType } from '@/services/recipes';

export async function generateRecipeAbortable(
  payload: { petId: string; planType: PlanType; goals?: string; usePantry?: boolean },
  opts?: { signal?: AbortSignal }
): Promise<{ recipe: any; recipeId: string | null }> {
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

  const data = await apiWithSignal.post<any>('/api/recipes/generate', body, { signal: opts?.signal });
  const recipe   = data?.recipe ?? data?.data ?? data;
  const recipeId = data?.recipeId ?? data?.id ?? null;
  return { recipe, recipeId };
}
