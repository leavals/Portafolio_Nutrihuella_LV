// src/routes/analytics.routes.ts
import { Router } from "express";
import { prisma } from "../services/prisma.ts";
import { authGuard } from "../middleware/auth.middleware.ts";

const r = Router();
r.use(authGuard);

// Helper
const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ---------- SUMMARY ----------
r.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    const [users, pets, dogs, cats, favorites, pantryItems, plusCount, basicCount] = await Promise.all([
      prisma.user.count(),
      prisma.pet.count(),
      prisma.pet.count({ where: { species: "DOG" } }),
      prisma.pet.count({ where: { species: "CAT" } }),
      prisma.favoriteRecipe.count(),
      prisma.pantryItem.count(),
      prisma.user.count({ where: { plan: "PLUS" } }),
      prisma.user.count({ where: { plan: "BASIC" } }),
    ]);

    const now = new Date();
    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const minus = (n: number) => new Date(now.getTime() - n * 86400000);

    const keys7 = Array.from({ length: 7 }, (_, i) => dayKey(minus(i)));
    const keys30 = Array.from({ length: 30 }, (_, i) => dayKey(minus(i)));
    const keys90 = Array.from({ length: 90 }, (_, i) => dayKey(minus(i)));

    const [s7, s30, s90] = await Promise.all([
      prisma.dailyStat.findMany({ where: { dateKey: { in: keys7 } }, select: { userId: true } }),
      prisma.dailyStat.findMany({ where: { dateKey: { in: keys30 } }, select: { userId: true } }),
      prisma.dailyStat.findMany({ where: { dateKey: { in: keys90 } }, select: { userId: true } }),
    ]);

    const uniq = (arr: any[]) => new Set(arr.map((x: any) => x.userId)).size;

    const activeUsers7d = uniq(s7);
    const activeUsers30d = uniq(s30);
    const activeUsers90d = uniq(s90);

    const safeDiv = (a: number, b: number) => (b > 0 ? a / b : 0);

    res.json({
      totals: {
        users,
        pets,
        dogs,
        cats,
        favorites,
        pantryItems,
        plusCount,
        basicCount,
        active7: activeUsers7d,
        active30: activeUsers30d,
        active90: activeUsers90d,
      },
      kpis: {
        petsPerUser: safeDiv(pets, users),
        favoritesPerUser: safeDiv(favorites, users),
        pantryPerUser: safeDiv(pantryItems, users),
        dogSharePct: safeDiv(dogs, Math.max(1, pets)) * 100,
        catSharePct: safeDiv(cats, Math.max(1, pets)) * 100,
        active7dPct: safeDiv(activeUsers7d, Math.max(1, users)) * 100,
        active30dPct: safeDiv(activeUsers30d, Math.max(1, users)) * 100,
        plusSharePct: safeDiv(plusCount, Math.max(1, users)) * 100,
        basicSharePct: safeDiv(basicCount, Math.max(1, users)) * 100,
      },
    });
  })
);

// ---------- USERS BY MONTH (con filtro de año y 12 meses completos) ----------
r.get(
  "/users-by-month",
  asyncHandler(async (req, res) => {
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);

    const rows = await prisma.$queryRaw<{ ym: string; users: bigint }[]>`
      SELECT strftime('%Y-%m', createdAt) AS ym, COUNT(*) AS users
      FROM User
      WHERE strftime('%Y', createdAt) = ${String(year)}
      GROUP BY ym
      ORDER BY ym
    `;

    const map = new Map(rows.map((r) => [r.ym, Number(r.users || 0n)]));
    const out = months.map((m) => ({ month: m, users: map.get(m) ?? 0, active: 0 }));
    res.json(out);
  })
);

// ---------- GEOGRAPHY ----------
r.get(
  "/geography",
  asyncHandler(async (_req, res) => {
    const communeRows = await prisma.$queryRaw<{ label: string; count: bigint }[]>`
      SELECT COALESCE(NULLIF(commune,''), 'Sin comuna') AS label, COUNT(*) AS count
      FROM User
      GROUP BY label
      ORDER BY count DESC
    `;
    const regionRows = await prisma.$queryRaw<{ label: string; count: bigint }[]>`
      SELECT COALESCE(NULLIF(region,''), 'Sin región') AS label, COUNT(*) AS count
      FROM User
      GROUP BY label
      ORDER BY count DESC
    `;
    const combined = [
      ...communeRows.map((r) => ({ label: r.label, count: Number(r.count || 0n), type: "commune" as const })),
      ...regionRows.map((r) => ({ label: r.label, count: Number(r.count || 0n), type: "region" as const })),
    ];
    res.json(combined);
  })
);

// ---------- PANTRY TOP ----------
r.get(
  "/pantry-top",
  asyncHandler(async (_req, res) => {
    const rows = await prisma.$queryRaw<{ item: string; count: bigint }[]>`
      SELECT COALESCE(NULLIF(normalized,''), name) AS item, COUNT(*) AS count
      FROM PantryItem
      GROUP BY item
      ORDER BY count DESC, item ASC
      LIMIT 50
    `;
    res.json(rows.map((r) => ({ item: r.item, count: Number(r.count || 0n) })));
  })
);

// ---------- SPECIES ----------
r.get(
  "/species",
  asyncHandler(async (_req, res) => {
    const rows = await prisma.pet.groupBy({ by: ["species"], _count: { _all: true } });
    res
      .json(
        rows
          .map((r) => ({ species: (r.species || "UNKNOWN").toUpperCase(), count: Number(r._count?._all || 0) }))
          .sort((a, b) => b.count - a.count)
      );
  })
);

// ---------- RECIPES BY TYPE ----------
r.get(
  "/recipes-by-type",
  asyncHandler(async (_req, res) => {
    const gen = await prisma.$queryRaw<{ planType: string; cnt: bigint }[]>`
      SELECT planType, COUNT(*) AS cnt FROM Recipe GROUP BY planType
    `;
    const fav = await prisma.$queryRaw<{ planType: string; cnt: bigint }[]>`
      SELECT COALESCE(planType,'UNKNOWN') AS planType, COUNT(*) AS cnt FROM FavoriteRecipe GROUP BY planType
    `;
    const types = new Set<string>([...gen.map((g) => g.planType), ...fav.map((f) => f.planType)]);
    const rows = Array.from(types).map((t) => ({
      planType: t,
      generated: Number(gen.find((x) => x.planType === t)?.cnt || 0n),
      saved: Number(fav.find((x) => x.planType === t)?.cnt || 0n),
    }));
    res.json(rows.sort((a, b) => b.generated + b.saved - (a.generated + a.saved)));
  })
);

// ---------- PLUS TOP TENURE ----------
r.get(
  "/plus-top-tenure",
  asyncHandler(async (_req, res) => {
    const plusUsers = await prisma.user.findMany({
      where: { plan: "PLUS" },
      select: { id: true, name: true, email: true, membershipUpdatedAt: true, createdAt: true },
    });
    const now = new Date().getTime();
    const rows = plusUsers
      .map((u) => {
        const since = u.membershipUpdatedAt ?? u.createdAt;
        const days = Math.floor((now - new Date(since).getTime()) / 86400000);
        return {
          userId: u.id,
          name: u.name ?? u.email,
          email: u.email,
          days,
          since: new Date(since).toISOString().slice(0, 10),
        };
      })
      .sort((a, b) => b.days - a.days)
      .slice(0, 10);
    res.json(rows);
  })
);

// ---------- HOURS HEATMAP (filtro por mes YYYY-MM) ----------
r.get(
  "/hours-heatmap",
  asyncHandler(async (req, res) => {
    const now = new Date();
    const monthParam = (req.query.month as string) || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const [yStr, mStr] = monthParam.split("-");
    const y = Number(yStr);
    const m = Number(mStr);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);

    // Sumamos actividad de varias tablas para asegurar datos
    const rows = await prisma.$queryRaw<{ w: number; h: number; cnt: bigint }[]>`
      SELECT w, h, COUNT(*) AS cnt
      FROM (
        SELECT CAST(strftime('%w', createdAt) AS INTEGER) AS w, CAST(strftime('%H', createdAt) AS INTEGER) AS h
        FROM AnalyticsEvent
        WHERE createdAt >= ${start.toISOString()} AND createdAt < ${end.toISOString()}
        UNION ALL
        SELECT CAST(strftime('%w', createdAt) AS INTEGER), CAST(strftime('%H', createdAt) AS INTEGER)
        FROM Recipe
        WHERE createdAt >= ${start.toISOString()} AND createdAt < ${end.toISOString()}
        UNION ALL
        SELECT CAST(strftime('%w', createdAt) AS INTEGER), CAST(strftime('%H', createdAt) AS INTEGER)
        FROM FavoriteRecipe
        WHERE createdAt >= ${start.toISOString()} AND createdAt < ${end.toISOString()}
        UNION ALL
        SELECT CAST(strftime('%w', createdAt) AS INTEGER), CAST(strftime('%H', createdAt) AS INTEGER)
        FROM PantryItem
        WHERE createdAt >= ${start.toISOString()} AND createdAt < ${end.toISOString()}
      ) q
      GROUP BY w, h
    `;

    const out = rows.map((r) => ({
      day: (r.w + 6) % 7, // 0=Lunes..6=Domingo
      hour: r.h,
      value: Number(r.cnt || 0n),
    }));
    res.json(out);
  })
);

export default r;
