// Rutas de autenticación + validador genérico Zod
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';

import { register, login, googleLogin, me } from '../controllers/auth.controller.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { RegisterSchema, LoginSchema, GoogleSchema } from '../schemas/auth.schema.js';

const r = Router();

// Middleware para validar req.body con Zod
const validate =
  (schema: z.ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.format());
    req.body = parsed.data;
    next();
  };

// Endpoints
r.post('/register', validate(RegisterSchema), register);
r.post('/login', validate(LoginSchema), login);
r.post('/google', validate(GoogleSchema), googleLogin);
r.get('/me', authGuard, me);

// 👈 export default para que app.ts pueda hacer import authRoutes from ...
export default r;
