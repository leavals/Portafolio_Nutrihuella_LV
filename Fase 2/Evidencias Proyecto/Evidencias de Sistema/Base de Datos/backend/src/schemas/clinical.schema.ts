import { z } from 'zod';

export const UpsertClinicalSchema = z.object({
  allergies: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  surgeries: z.array(z.string()).optional(),
  lastVetVisit: z.string().optional(),
  lastDeworming: z.string().optional(),
  lastFleaTick: z.string().optional(),
  bloodType: z.string().optional(),
  vetClinic: z.string().optional(),
  vetPhone: z.string().optional(),
  notes: z.string().optional(),
});

export const VaccinationSchema = z.object({
  name: z.string().min(1),
  date: z.string().optional(),
});

export const DiseaseSchema = z.object({
  name: z.string().min(1),
  diagnosedAt: z.string().optional(),
  status: z.string().optional(),
});

export const WeightLogSchema = z.object({
  date: z.string().optional(),
  weightKg: z.number().positive(),
});
