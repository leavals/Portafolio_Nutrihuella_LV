import { Router } from 'express';
import {
  register,
  login,
  googleLogin,
  me,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  RegisterSchema,
  LoginSchema,
  GoogleSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema
} from '../schemas/auth.schema.js';

const r = Router();

r.post('/register', validate(RegisterSchema), register);
r.post('/login',    validate(LoginSchema),    login);
r.post('/google',   validate(GoogleSchema),   googleLogin); // ✅ sin z, con schema propio
r.get('/me',        authGuard,                me);
r.post('/forgot',   validate(ForgotPasswordSchema), forgotPassword);
r.post('/reset',    validate(ResetPasswordSchema),  resetPassword);

export default r;
