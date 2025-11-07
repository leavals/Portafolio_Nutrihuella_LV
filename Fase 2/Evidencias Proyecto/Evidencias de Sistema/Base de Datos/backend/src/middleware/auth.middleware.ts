// src/middleware/auth.middleware.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env.ts";
import { prisma } from "../services/prisma.ts";

export interface JwtPayloadLike {
  sub?: string;
  email?: string;
  role?: string;
  is_admin?: boolean;
  [k: string]: any;
}

export function authGuard(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No autorizado" });

    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayloadLike;
    const userId = payload.sub || (payload as any).userId;
    if (!userId) return res.status(401).json({ message: "Token inválido" });

    (req as any).userId = userId;
    (req as any).user = {
      id: userId,
      email: payload.email,
      role: payload.role,
      is_admin: payload.is_admin ?? false,
      ...payload,
    };

    return next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
}

/**
 * requireRole: valida contra DB para evitar tokens caducados o manipulados.
 * - Acepta un único rol o una lista de roles permitidos.
 */
export function requireRole(roles: string | string[]) {
  const allow = Array.isArray(roles) ? roles.map(r => r.toUpperCase()) : [String(roles).toUpperCase()];
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string | undefined = (req as any).userId;
      if (!userId) return res.status(401).json({ message: "No autorizado" });

      const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, deactivatedAt: true, isSuspended: true } });
      if (!u) return res.status(401).json({ message: "No autorizado" });
      if (u.deactivatedAt || u.isSuspended) return res.status(403).json({ message: "Cuenta desactivada o suspendida" });

      const role = (u.role || "USER").toUpperCase();
      if (!allow.includes(role)) return res.status(403).json({ message: "Permisos insuficientes" });

      return next();
    } catch (e) {
      return res.status(401).json({ message: "No autorizado" });
    }
  };
}

export default authGuard;
