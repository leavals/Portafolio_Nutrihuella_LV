// backend/src/routes/auth.routes.ts
import { Router } from 'express';
import {
  register,
  login,
  googleLogin,
  me,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.ts';
import { authGuard } from '../middleware/auth.middleware.ts';
import { validate } from '../middleware/validate.middleware.ts';
import {
  RegisterSchema,
  LoginSchema,
  GoogleSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema
} from '../schemas/auth.schema.ts';

const r = Router();

r.post('/register', validate(RegisterSchema), register);
r.post('/login',    validate(LoginSchema),    login);
r.post('/google',   validate(GoogleSchema),   googleLogin);
r.get('/me',        authGuard,                me);
r.post('/forgot',   validate(ForgotPasswordSchema), forgotPassword);
r.post('/reset',    validate(ResetPasswordSchema),  resetPassword);

export default r;
