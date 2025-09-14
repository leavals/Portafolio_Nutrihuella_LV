// ------------------------------------------------------------
// Zod Schemas - Autenticación (validaciones reforzadas)
// ------------------------------------------------------------
import { z } from 'zod';

const strongPwd = z.string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe incluir una mayúscula')
  .regex(/[a-z]/, 'Debe incluir una minúscula')
  .regex(/\d/, 'Debe incluir un número')
  .regex(/[^A-Za-z0-9]/, 'Debe incluir un símbolo');

export const RegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  password: strongPwd,
  name: z.string().min(2, 'Nombre mínimo 2 caracteres').max(80, 'Nombre muy largo').optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Contraseña requerida'),
});

export const GoogleSchema = z.object({
  idToken: z.string().min(10, 'Token inválido'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(24, 'Token inválido'),
  newPassword: strongPwd,
});
