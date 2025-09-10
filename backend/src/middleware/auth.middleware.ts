// Middleware para proteger rutas con JWT
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';

export function authGuard(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization; // "Bearer <token>"
  if (!header) return res.sendStatus(401);

  const [, token] = header.split(' ');
  try {
    const payload = jwt.verify(token, env.JWT_SECRET as string) as { sub: string };
    // adjuntamos el userId al request para usarlo en controladores
    (req as any).userId = payload.sub;
    next();
  } catch {
    return res.sendStatus(401);
  }
}
