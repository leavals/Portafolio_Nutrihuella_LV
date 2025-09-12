import { z } from 'zod';
export const UpsertNutritionSchema = z.object({
  dietType: z.string().default('RAW'),
  mealsPerDay: z.number().int().positive().default(2),
  activityLevel: z.string().default('MODERATE'),
  goal: z.string().default('MAINTENANCE'),

  preferredFoods: z.array(z.string()).optional(),
  forbiddenFoods: z.array(z.string()).optional(),
  intolerances: z.array(z.string()).optional(),
  foodAllergies: z.array(z.string()).optional(),
  supplements: z.array(z.string()).optional(),

  dailyCalories: z.number().int().positive().nullable().optional(),
  waterIntakeMl: z.number().int().positive().nullable().optional(),
  notes: z.string().optional(),
});
