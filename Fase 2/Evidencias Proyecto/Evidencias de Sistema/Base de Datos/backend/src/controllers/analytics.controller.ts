// src/controllers/analytics.controller.ts
import type { Request, Response } from 'express';
import { prisma } from '../services/prisma.ts';

/**
 * Utilidades
 */
function yyyymm(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
function addMonths(d: Date, delta: number) {
  const nd = new Date(d);
  nd.setMonth(nd.getMonth() + delta);
  return nd;
}
function rangeMonthsInclusive(end: Date, count: number) {
  // devuelve un arreglo de claves YYYY-MM para los últimos `count` meses, terminando en `end` (incluido)
  const months: string[] = [];
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  for (let i = count - 1; i >= 0; i--) {
    const dt = addMonths(last, -i);
    months.push(yyyymm(dt));
  }
  return months;
}

/**
 * GET /api/analytics/summary
 * - Totales y métricas rápidas
 */
export async function summary(_req: Request, res: Response) {
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 86400000);
  const d30 = new Date(now.getTime() - 30 * 86400000);
  const d90 = new Date(now.getTime() - 90 * 86400000);

  // Totales base
  const [
    usersTotal,
    petsTotal,
    recipesTotal,
    favoritesTotal,
    pantryTotal,
    dogsTotal,
    catsTotal,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.pet.count(),
    prisma.recipe.count(),
    prisma.favoriteRecipe.count(),
    prisma.pantryItem.count(),
    prisma.pet.count({ where: { species: 'DOG' } }),
    prisma.pet.count({ where: { species: 'CAT' } }),
  ]);

  // Usuarios activos (aprox) usando DailyStat (siembra lo pobló)
  // Distintos usuarios con actividad registrada en la ventana.
  const [active7d, active30d, active90d] = await Promise.all([
    prisma.dailyStat.findMany({
      where: { createdAt: { gte: d7 } },
      select: { userId: true },
      distinct: ['userId'],
    }).then((r) => r.length),
    prisma.dailyStat.findMany({
      where: { createdAt: { gte: d30 } },
      select: { userId: true },
      distinct: ['userId'],
    }).then((r) => r.length),
    prisma.dailyStat.findMany({
      where: { createdAt: { gte: d90 } },
      select: { userId: true },
      distinct: ['userId'],
    }).then((r) => r.length),
  ]);

  return res.json({
    usersTotal,
    active7d,
    active30d,
    active90d,
    petsTotal,
    dogsTotal,
    catsTotal,
    recipesTotal,
    favoritesTotal,
    pantryTotal,
  });
}

/**
 * GET /api/analytics/users-by-month?months=12
 * - Altas (signups) por mes y usuarios activos por mes (aprox por DailyStat)
 */
export async function usersByMonth(req: Request, res: Response) {
  const months = Math.max(3, Math.min(36, Number(req.query.months) || 12));
  const now = new Date();
  const firstMonth = addMonths(new Date(now.getFullYear(), now.getMonth(), 1), -(months - 1));
  const firstMonthStr = yyyymm(firstMonth);
  const keys = rangeMonthsInclusive(now, months);

  // Signups (User.createdAt)
  const users = await prisma.user.findMany({
    where: { createdAt: { gte: firstMonth } },
    select: { createdAt: true },
  });

  const signupsByMonth = Object.fromEntries(keys.map((k) => [k, 0]));
  for (const u of users) {
    const k = yyyymm(u.createdAt);
    if (k >= firstMonthStr && k in signupsByMonth) signupsByMonth[k]++;
  }

  // Activos por mes (DailyStat.createdAt)
  const stats = await prisma.dailyStat.findMany({
    where: { createdAt: { gte: firstMonth } },
    select: { createdAt: true, userId: true },
  });

  const activeMap: Record<string, Set<string>> = Object.fromEntries(
    keys.map((k) => [k, new Set<string>()]),
  );
  for (const s of stats) {
    const k = yyyymm(s.createdAt);
    if (k >= firstMonthStr && activeMap[k]) activeMap[k].add(s.userId);
  }

  const activeByMonth = Object.fromEntries(keys.map((k) => [k, activeMap[k].size]));

  return res.json({
    months: keys, // orden cronológico
    signups: keys.map((k) => signupsByMonth[k]),
    actives: keys.map((k) => activeByMonth[k]),
  });
}

/**
 * GET /api/analytics/geography
 * - Distribución por región/comuna
 * Nota: si tu esquema aún no tiene campos geográficos en User, devolvemos arreglos vacíos.
 */
export async function geography(_req: Request, res: Response) {
  // Intento de detectar columnas opcionales sin romper el build:
  // Como Prisma es tipado en tiempo de compilación, no podemos "probar campos".
  // Entregamos estructura vacía que el frontend ya maneja.
  return res.json({
    byRegion: [],   // [{ label: 'Metropolitana', value: 123 }, ...]
    byCommune: [],  // [{ label: 'Maipú', value: 45 }, ...]
  });
}

/**
 * GET /api/analytics/pantry-top?limit=20
 * - Top ítems de despensa y categorías más frecuentes
 */
export async function pantryTop(req: Request, res: Response) {
  const limit = Math.max(5, Math.min(50, Number(req.query.limit) || 20));

  // Top por nombre
  const byItem = await prisma.pantryItem.groupBy({
    by: ['name'],
    _count: { _all: true },
    orderBy: { _count: { _all: 'desc' } },
    take: limit,
  });

  // Top por categoría
  const byCategory = await prisma.pantryItem.groupBy({
    by: ['category'],
    _count: { _all: true },
    orderBy: { _count: { _all: 'desc' } },
    take: limit,
  });

  return res.json({
    items: byItem
      .filter((r) => r.name && r.name.trim())
      .map((r) => ({ label: r.name, value: r._count._all })),
    categories: byCategory
      .filter((r) => r.category && r.category.trim())
      .map((r) => ({ label: r.category!, value: r._count._all })),
  });
}
