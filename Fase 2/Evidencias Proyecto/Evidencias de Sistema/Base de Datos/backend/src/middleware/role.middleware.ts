// src/middleware/role.middleware.ts
// Control de acceso por rol, complementario a authGuard

import type { Request, Response, NextFunction } from "express";

/**
 * requireRole('ADMIN') o requireRole('ADMIN','ANALYST')
 * - Requiere que authGuard haya puesto (req as any).user.role
 */
export function requireRole(...roles: string[]) {
  const allowed = roles.map((r) => r.toUpperCase());
  return function (req: Request, res: Response, next: NextFunction) {
    const u = (req as any).user;
    if (!u || !u.role) {
      return res.status(401).json({ message: "No autorizado" });
    }
    const role = String(u.role).toUpperCase();
    if (!allowed.includes(role)) {
      return res.status(403).json({ message: "Acceso denegado" });
    }
    next();
  };
}
