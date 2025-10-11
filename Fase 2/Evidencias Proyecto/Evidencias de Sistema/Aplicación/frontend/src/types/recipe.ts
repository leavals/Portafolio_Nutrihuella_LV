// src/types/recipe.ts
export type Meal = { name: string; items: string[] };

export type RecipePlan = {
  title: string;
  goal?: string;
  constraints?: string | string[];
  meals: Meal[];
  disclaimer?: string;
};
