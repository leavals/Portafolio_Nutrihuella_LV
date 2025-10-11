import { z } from 'zod';
export const UpsertNutritionSchema = z.object({
  dietType: z.string().default('MIXED'),
  mealsPerDay: z.number().int().positive().default(2),
  activityLevel: z.string().default('MODERATE'),
  goal: z.string().default('MAINTENANCE'),

  preferredFoods: z.array(z.string()).nullable().optional(),
  forbiddenFoods: z.array(z.string()).nullable().optional(),
  intolerances: z.array(z.string()).nullable().optional(),
  foodAllergies: z.array(z.string()).nullable().optional(),
  supplements: z.array(z.string()).nullable().optional(),

  dailyCalories: z.number().int().positive().nullable().optional(),
  waterIntakeMl: z.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
});
