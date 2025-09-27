import { z } from "zod";

const asDateOpt = z.preprocess(v => {
  if (typeof v === "string" && v.trim()) return new Date(v);
  if (v instanceof Date) return v;
  return undefined;
}, z.date().optional());

export const PantryCreateSchema = z.object({
  name: z.string().min(2),
  keywordsCsv: z.string().max(300).optional(),
  quantity: z.coerce.number().optional(),
  unit: z.string().max(12).optional(),
  category: z.string().max(24).optional(),
  purchasedAt: asDateOpt,
  expiresAt: asDateOpt,
  notes: z.string().max(500).optional(),
});

export const PantryUpdateSchema = PantryCreateSchema.partial();
