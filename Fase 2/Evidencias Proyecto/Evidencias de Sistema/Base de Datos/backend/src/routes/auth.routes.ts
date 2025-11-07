// backend/src/routes/auth.routes.ts
import { Router } from 'express';
import {
  register,
  login,
  googleLogin,
  me,
  forgotPassword,
  resetPassword,
  verifyEmail,     // ✅ ahora existe
  resendVerify,    // ✅ nuevo
} from '../controllers/auth.controller.ts';
import { authGuard } from '../middleware/auth.middleware.ts';
import { validate } from '../middleware/validate.middleware.ts';
import {
  RegisterSchema,
  LoginSchema,
  GoogleSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,     // ✅ nuevo
  ResendVerifySchema,    // ✅ nuevo
} from '../schemas/auth.schema.ts';

const r = Router();

r.post('/register', validate(RegisterSchema), register);
r.post('/login',    validate(LoginSchema),    login);
r.post('/google',   validate(GoogleSchema),   googleLogin);

r.get('/me',        authGuard,                me);

r.post('/forgot',   validate(ForgotPasswordSchema), forgotPassword);
r.post('/reset',    validate(ResetPasswordSchema),  resetPassword);

// Verificación de email
r.post('/verify',         validate(VerifyEmailSchema),  verifyEmail);
r.post('/verify/resend',  validate(ResendVerifySchema), resendVerify);

export default r;
