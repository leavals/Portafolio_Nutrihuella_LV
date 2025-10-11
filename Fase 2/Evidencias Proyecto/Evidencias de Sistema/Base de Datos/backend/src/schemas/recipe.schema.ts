// src/schemas/recipe.schema.ts
import { z } from "zod";

export const PlanTypeEnum = z.enum(["BREAKFAST", "LUNCH", "DINNER", "DAILY", "WEEKLY"]);

export const GenerateRecipeSchema = z.object({
  planType: PlanTypeEnum.default("DAILY"),
  goals: z.string().default("").optional(),
  petId: z.string().min(1, "Debe seleccionar una mascota").optional(),
  // Permite mandar el perfil embebido si no quieres usar petId
  petProfile: z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
      species: z.string().optional(),
      breed: z.string().optional(),
      ageYears: z.number().nullable().optional(),
      weightKg: z.number().nullable().optional(),
      sex: z.string().optional(),
      sterilized: z.boolean().optional(),
      size: z.string().optional(),
      activityLevel: z.string().optional(),
      allergies: z.array(z.string()).optional(),
      diseases: z.array(z.string()).optional(),
      vaccines: z.array(z.string()).optional(),
      lastWeights: z.array(z.object({ date: z.any(), kg: z.number().nullable().optional() })).optional(),
      nutritionNotes: z.string().optional(),
    })
    .optional(),
  // Lista de ingredientes opcional (si no, se leerá de Pantry del usuario)
  pantry: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number().optional(),
        unit: z.string().optional(),
      })
    )
    .optional(),
});

export const AddFavoriteSchema = z.object({
  recipeId: z.string().optional(),
  recipe: z.any().optional(), // JSON de la receta cuando aún no está guardada
  title: z.string().optional(),
  planType: PlanTypeEnum.optional(),
  petId: z.string().optional(),
});

export const FeedbackSchema = z.object({
  rating: z.number().int().refine((v) => v === -1 || v === 1, "rating debe ser -1 o 1"),
  comment: z.string().optional(),
});
