// backend/src/middleware/auth.middleware.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env.ts";

export interface JwtPayloadLike {
  sub?: string;
  email?: string;
  role?: string;
  is_admin?: boolean;
  [k: string]: any;
}

/**
 * authGuard
 * - Lee el token Bearer del header Authorization.
 * - Verifica con JWT_SECRET.
 * - Propaga ambos:
 *    (req as any).userId = string    // compat con cÃ³digo existente
 *    (req as any).user = { id, ... } // objeto rico para features nuevas
 */
export function authGuard(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth.split(" ")[1];

    if (!token) return res.status(401).json({ message: "No autorizado" });

    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayloadLike;

    const userId = payload.sub || (payload as any).userId;
    if (!userId) return res.status(401).json({ message: "Token invÃ¡lido" });

    // Compatibilidad con controladores antiguos:
    (req as any).userId = userId;

    // Nuevo objeto de usuario (por si el token trae mÃ¡s datos):
    (req as any).user = {
      id: userId,
      email: payload.email,
      role: payload.role,
      is_admin: payload.is_admin ?? false,
      // dejamos el resto del payload por si es Ãºtil:
      ...payload,
    };

    return next();
  } catch {
    return res.status(401).json({ message: "Token invÃ¡lido" });
  }
}

export default authGuard;

