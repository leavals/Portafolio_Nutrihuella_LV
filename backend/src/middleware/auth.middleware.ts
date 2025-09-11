import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';

export function authGuard(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization || '';
  const [, token] = h.split(' ');
  if (!token) return res.status(401).json({ message: 'No autorizado' });
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub?: string };
    (req as any).userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido' });
  }
}
