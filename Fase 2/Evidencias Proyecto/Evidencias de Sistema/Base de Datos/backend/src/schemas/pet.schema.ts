import { z } from 'zod';

export const SizeEnum = z.enum(["TOY", "SMALL", "MEDIUM", "LARGE", "GIANT"]);
export const CreatePetSchema = z.object({
  name: z.string().min(1),
  species: z.string().default('DOG'),
  sex: z.string().optional(),
  breed: z.string().optional(),
  birthDate: z.coerce.date().nullable().optional(),
  size: SizeEnum.optional().default("MEDIUM"),
  weightKg: z.number().positive().nullable().optional(),
  sterilized: z.boolean().optional().default(false),
});
export const UpdatePetSchema = CreatePetSchema.partial();
