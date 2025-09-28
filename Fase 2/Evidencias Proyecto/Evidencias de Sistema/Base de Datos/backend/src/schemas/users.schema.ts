import { z } from 'zod';

export const UpdateMeSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto').max(80, 'Nombre muy largo').optional(),
  // Si envías archivo, este campo puede omitirse. Si envías URL directa, debe ser válida.
  picture: z.string().url('URL de imagen inválida').optional(),
}).strict();

const strongPwd = z.string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe incluir una mayúscula')
  .regex(/[a-z]/, 'Debe incluir una minúscula')
  .regex(/\d/, 'Debe incluir un número')
  .regex(/[^A-Za-z0-9]/, 'Debe incluir un símbolo');

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().optional().default(''),
  newPassword: strongPwd,
}).refine((d) => (d.newPassword ?? '') !== (d.currentPassword ?? ''), {
  message: 'La nueva contraseña no puede ser igual a la actual',
  path: ['newPassword'],
});
