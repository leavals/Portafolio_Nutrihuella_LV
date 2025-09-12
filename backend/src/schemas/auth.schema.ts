// ------------------------------------------------------------
// Zod Schemas - Autenticación
// ------------------------------------------------------------
import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  name: z.string().min(2).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const GoogleSchema = z.object({
  idToken: z.string().min(10),
});

// Recuperar / resetear contraseña (solo usuarios locales)
export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(24),
  newPassword: z.string().min(6),
});
