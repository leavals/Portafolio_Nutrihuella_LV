// src/schemas/admin.schema.ts
// Validaciones para endpoints de administración

import { z } from "zod";

export const ListUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().max(120).optional(),
  comuna: z.string().max(60).optional(),
  role: z.enum(["USER", "ADMIN", "ANALYST"]).optional(),
});

export const UpdateUserRoleSchema = z.object({
  role: z.enum(["USER", "ADMIN", "ANALYST"]),
});

export const VerifyUserSchema = z.object({
  verified: z.boolean(),
});
