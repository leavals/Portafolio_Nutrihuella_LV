import { z } from 'zod';
export const CreatePetSchema = z.object({
  name: z.string().min(1),
  species: z.string().default('DOG'),
  sex: z.string().optional(),
  breed: z.string().optional(),
  age: z.number().int().nonnegative().nullable().optional(),
  weightKg: z.number().positive().nullable().optional(),
});
export const UpdatePetSchema = CreatePetSchema.partial();
