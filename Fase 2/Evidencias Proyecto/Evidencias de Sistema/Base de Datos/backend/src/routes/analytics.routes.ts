// src/routes/analytics.routes.ts
// ======================================================================
// Rutas de analítica — NutriHuella (SQLite / Prisma)
// Corrige manejo de fechas guardadas en epoch MILISEGUNDOS.
// Incluye endpoints ejecutivos + /dev/boost + embudo y recetas por tipo.
// ======================================================================

import { Router } from "express";
import { prisma } from "../services/prisma.ts";
import { authGuard } from "../middleware/auth.middleware.ts";
import { boostAnalyticsData } from "../services/analytics.boost.ts";

const r = Router();
r.use(authGuard);

// ----------------------------- Helpers --------------------------------
const pad2 = (n: number) => String(n).padStart(2, "0");
const yyyymmdd = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const asyncHandler =
  (fn: any) => (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// ======================================================================
// [DEV] BOOST — Inserta datos para demos/QA
// POST /api/analytics/dev/boost?year=2024&users=180&payments=360&events=1200
// ======================================================================
r.post(
  "/dev/boost",
  asyncHandler(async (req, res) => {
    const year = Number(req.query.year) || new Date().getFullYear();
    const users = req.query.users ? Number(req.query.users) : undefined;
    const payments = req.query.payments ? Number(req.query.payments) : undefined;
    const events = req.query.events ? Number(req.query.events) : undefined;

    const out = await boostAnalyticsData({ year, users, payments, events });
    res.json({ ok: true, ...out });
  })
);

// ======================================================================
// SUMMARY (KPIs rápidos)
// Nota: aquí mantenemos DailyStat por dateKey (YYYY-MM-DD) y
// eventos por epoch ms con filtro >= última clave consultada.
// ======================================================================
r.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    const [users, pets, dogs, cats, favorites, pantryItems, plusCount, basicCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.pet.count(),
        prisma.pet.count({ where: { species: "DOG" } }),
        prisma.pet.count({ where: { species: "CAT" } }),
        prisma.favoriteRecipe.count().catch(() => 0),
        prisma.pantryItem.count().catch(() => 0),
        prisma.user.count({ where: { plan: "PLUS" } }),
        prisma.user.count({ where: { plan: "BASIC" } }),
      ]);

    const now = new Date();
    const dayKey = (d: Date) => yyyymmdd(d);
    const minus = (n: number) => new Date(now.getTime() - n * 86400000);

    const keys7 = Array.from({ length: 7 }, (_, i) => dayKey(minus(i)));
    const keys30 = Array.from({ length: 30 }, (_, i) => dayKey(minus(i)));
    const keys90 = Array.from({ length: 90 }, (_, i) => dayKey(minus(i)));

    const [s7, s30, s90] = await Promise.all([
      prisma.dailyStat.findMany({
        where: { dateKey: { in: keys7 } },
        select: { userId: true, recipesGeneratedCount: true },
      }),
      prisma.dailyStat.findMany({
        where: { dateKey: { in: keys30 } },
        select: { userId: true, recipesGeneratedCount: true },
      }),
      prisma.dailyStat.findMany({
        where: { dateKey: { in: keys90 } },
        select: { userId: true, recipesGeneratedCount: true },
      }),
    ]);

    // Eventos desde la última fecha (ms)
    const lastKey = keys90.at(-1)!;
    const lastStartMs = new Date(`${lastKey}T00:00:00.000Z`).getTime();
    const events90 = await prisma.$queryRaw<{ userId: string }[]>`
      SELECT userId
      FROM AnalyticsEvent
      WHERE createdAt >= ${lastStartMs}
    `;

    const countActive = (keys: string[]) => {
      const dSet = new Set(
        (keys.length === 7 ? s7 : keys.length === 30 ? s30 : s90)
          .filter((d) => (d.recipesGeneratedCount ?? 0) > 0)
          .map((d) => d.userId)
      );
      const eSet = new Set(events90.map((e) => e.userId));
      const merged = new Set<string>([...dSet, ...eSet]);
      return merged.size;
    };

    const active7 = countActive(keys7);
    const active30 = countActive(keys30);
    const active90 = countActive(keys90);

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
        active7,
        active30,
        active90,
      },
      kpis: {
        petsPerUser: safeDiv(pets, users),
        favoritesPerUser: safeDiv(favorites, users),
        pantryPerUser: safeDiv(pantryItems, users),
        dogSharePct: safeDiv(dogs, Math.max(1, pets)) * 100,
        catSharePct: safeDiv(cats, Math.max(1, pets)) * 100,
        active7dPct: safeDiv(active7, Math.max(1, users)) * 100,
        active30dPct: safeDiv(active30, Math.max(1, users)) * 100,
        plusSharePct: safeDiv(plusCount, Math.max(1, users)) * 100,
        basicSharePct: safeDiv(basicCount, Math.max(1, users)) * 100,
      },
    });
  })
);

// ======================================================================
// 1) CRECIMIENTO — Altas vs Conversiones a PLUS por mes
// Corrige epoch: strftime(..., createdAt/1000, 'unixepoch')
// ======================================================================
r.get(
  "/growth-by-month",
  asyncHandler(async (req, res) => {
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => `${year}-${pad2(i + 1)}`);

    const signups = await prisma.$queryRaw<{ ym: string; cnt: bigint }[]>`
      SELECT strftime('%Y-%m', createdAt/1000, 'unixepoch') as ym, COUNT(*) as cnt
      FROM User
      WHERE strftime('%Y', createdAt/1000, 'unixepoch') = ${String(year)}
      GROUP BY ym
      ORDER BY ym
    `;

    const plus = await prisma.$queryRaw<{ ym: string; cnt: bigint }[]>`
      SELECT strftime('%Y-%m', membershipUpdatedAt/1000, 'unixepoch') as ym, COUNT(*) as cnt
      FROM User
      WHERE plan = 'PLUS'
        AND membershipUpdatedAt IS NOT NULL
        AND strftime('%Y', membershipUpdatedAt/1000, 'unixepoch') = ${String(year)}
      GROUP BY ym
      ORDER BY ym
    `;

    const sMap = new Map(signups.map((r) => [r.ym, Number(r.cnt || 0n)]));
    const pMap = new Map(plus.map((r) => [r.ym, Number(r.cnt || 0n)]));

    const out = months.map((m) => ({
      month: m,
      signups: sMap.get(m) ?? 0,
      plus: pMap.get(m) ?? 0,
    }));
    res.json(out);
  })
);

// ======================================================================
// 2) ACTIVIDAD — DAU (7–120 días)
// DailyStat por dateKey; Events por epoch ms + agrupación por día.
// ======================================================================
r.get(
  "/activity-dau",
  asyncHandler(async (req, res) => {
    const days = Math.max(7, Math.min(120, Number(req.query.days) || 30));

    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - (days - 1));

    const startKey = yyyymmdd(start);
    const endKey = yyyymmdd(end);
    const startMs = new Date(`${startKey}T00:00:00.000Z`).getTime();
    const endMs = new Date(`${endKey}T23:59:59.999Z`).getTime();

    const rows = await prisma.$queryRaw<{ ymd: string; userId: string }[]>`
      SELECT d.dateKey as ymd, d.userId
      FROM DailyStat d
      WHERE d.dateKey >= ${startKey} AND d.dateKey <= ${endKey}
        AND d.recipesGeneratedCount > 0
      UNION
      SELECT strftime('%Y-%m-%d', e.createdAt/1000, 'unixepoch') as ymd, e.userId
      FROM AnalyticsEvent e
      WHERE e.createdAt BETWEEN ${startMs} AND ${endMs}
    `;

    const byDay = new Map<string, Set<string>>();
    for (const r0 of rows) {
      if (!byDay.has(r0.ymd)) byDay.set(r0.ymd, new Set<string>());
      byDay.get(r0.ymd)!.add(r0.userId);
    }

    const out: Array<{ date: string; dau: number }> = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const dk = yyyymmdd(cursor);
      out.push({ date: dk, dau: byDay.get(dk)?.size ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    res.json(out);
  })
);

// ======================================================================
// 3) INGRESOS — por mes + ARPU
// Payment.createdAt en epoch ms; DailyStat por dateKey; Events por epoch ms.
// ======================================================================
r.get(
  "/revenue-by-month",
  asyncHandler(async (req, res) => {
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => `${year}-${pad2(i + 1)}`);

    const rev = await prisma.$queryRaw<{ ym: string; amount: number }[]>`
      SELECT strftime('%Y-%m', createdAt/1000, 'unixepoch') as ym, SUM(amount) as amount
      FROM Payment
      WHERE status = 'AUTHORIZED'
        AND strftime('%Y', createdAt/1000, 'unixepoch') = ${String(year)}
      GROUP BY ym
      ORDER BY ym
    `;

    const act = await prisma.$queryRaw<{ ym: string; users: bigint }[]>`
      SELECT ym, COUNT(DISTINCT userId) as users
      FROM (
        SELECT strftime('%Y-%m', e.createdAt/1000, 'unixepoch') as ym, e.userId
        FROM AnalyticsEvent e
        WHERE strftime('%Y', e.createdAt/1000, 'unixepoch') = ${String(year)}
        UNION
        SELECT substr(d.dateKey, 1, 7) as ym, d.userId
        FROM DailyStat d
        WHERE substr(d.dateKey, 1, 4) = ${String(year)} AND d.recipesGeneratedCount > 0
      ) q
      GROUP BY ym
      ORDER BY ym
    `;

    const rMap = new Map(rev.map((r) => [r.ym, Number(r.amount || 0)]));
    const aMap = new Map(act.map((r) => [r.ym, Number(r.users || 0n)]));

    const out = months.map((m) => {
      const revenue = rMap.get(m) ?? 0;
      const active = aMap.get(m) ?? 0;
      const arpu = active > 0 ? revenue / active : 0;
      return { month: m, revenue, arpu };
    });
    res.json(out);
  })
);

// ======================================================================
// 4) DISPOSITIVOS — Uso por dispositivo (30–120 días)
// Filtro por epoch ms y solo agrupación por device.
// ======================================================================
r.get(
  "/devices-share",
  asyncHandler(async (req, res) => {
    const days = Math.max(30, Math.min(120, Number(req.query.days) || 120));
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - (days - 1));

    const startKey = yyyymmdd(start);
    const endKey = yyyymmdd(end);
    const startMs = new Date(`${startKey}T00:00:00.000Z`).getTime();
    const endMs = new Date(`${endKey}T23:59:59.999Z`).getTime();

    const rows = await prisma.$queryRaw<{ device: string; cnt: bigint }[]>`
      SELECT
        CASE WHEN IFNULL(device,'') = '' THEN 'UNKNOWN' ELSE device END AS device,
        COUNT(*) AS cnt
      FROM AnalyticsEvent
      WHERE createdAt BETWEEN ${startMs} AND ${endMs}
      GROUP BY device
      ORDER BY cnt DESC
    `;
    res.json(rows.map((r) => ({ device: r.device, count: Number(r.cnt || 0n) })));
  })
);

// ======================================================================
// 5) GEOGRAFÍA — Top comunas y regiones (arreglo plano)
// ======================================================================
r.get(
  "/geography",
  asyncHandler(async (_req, res) => {
    const communes = await prisma.$queryRaw<{ label: string; cnt: bigint }[]>`
      SELECT
        CASE WHEN IFNULL(commune,'') = '' THEN 'UNKNOWN' ELSE commune END AS label,
        COUNT(*) AS cnt
      FROM User
      GROUP BY label
      ORDER BY cnt DESC
      LIMIT 50
    `;

    const regions = await prisma.$queryRaw<{ label: string; cnt: bigint }[]>`
      SELECT
        CASE WHEN IFNULL(region,'') = '' THEN 'UNKNOWN' ELSE region END AS label,
        COUNT(*) AS cnt
      FROM User
      GROUP BY label
      ORDER BY cnt DESC
      LIMIT 30
    `;

    const out = [
      ...communes.map((r) => ({ label: r.label, count: Number(r.cnt || 0n), type: "commune" as const })),
      ...regions.map((r) => ({ label: r.label, count: Number(r.cnt || 0n), type: "region" as const })),
    ];

    res.json(out);
  })
);

// ======================================================================
// 6) EMBUDO — Activación (30–120 días)
// ======================================================================
r.get(
  "/activation-funnel",
  asyncHandler(async (req, res) => {
    const days = Math.max(30, Math.min(120, Number(req.query.days) || 30));
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - (days - 1));

    const startKey = yyyymmdd(start);
    const endKey = yyyymmdd(end);
    const startMs = new Date(`${startKey}T00:00:00.000Z`).getTime();
    const endMs = new Date(`${endKey}T23:59:59.999Z`).getTime();

    const [totalUsers, activeRows, generatedRows, plusUsers] = await Promise.all([
      prisma.user.count(),
      prisma.$queryRaw<{ userId: string }[]>`
        SELECT d.userId
        FROM DailyStat d
        WHERE d.dateKey >= ${startKey} AND d.dateKey <= ${endKey} AND d.recipesGeneratedCount > 0
        UNION
        SELECT e.userId
        FROM AnalyticsEvent e
        WHERE e.createdAt BETWEEN ${startMs} AND ${endMs}
      `,
      prisma.$queryRaw<{ userId: string }[]>`
        SELECT e.userId
        FROM AnalyticsEvent e
        WHERE e.type = 'RECIPE_GENERATED'
          AND e.createdAt BETWEEN ${startMs} AND ${endMs}
        UNION
        SELECT d.userId
        FROM DailyStat d
        WHERE d.dateKey >= ${startKey} AND d.dateKey <= ${endKey} AND d.recipesGeneratedCount > 0
      `,
      prisma.user.count({ where: { plan: "PLUS" } }),
    ]);

    // Favoritos (opcional: tabla puede no existir)
    let favRows: { userId: string }[] = [];
    try {
      favRows = await prisma.$queryRaw<{ userId: string }[]>`
        SELECT userId
        FROM FavoriteRecipe
        WHERE createdAt BETWEEN ${startMs} AND ${endMs}
      `;
    } catch {
      favRows = [];
    }

    const distinct = (rows: { userId: string }[]) =>
      new Set(rows.map((r) => r.userId)).size;

    const out = [
      { stage: "Usuarios totales", count: totalUsers },
      { stage: `Activos (${days}d)`, count: distinct(activeRows) },
      { stage: `Generaron receta (${days}d)`, count: distinct(generatedRows) },
      { stage: `Agregaron favoritos (${days}d)`, count: distinct(favRows) },
      { stage: "PLUS actuales", count: plusUsers },
    ];

    res.json(out);
  })
);

// ======================================================================
// 7) RECETAS — Generadas vs Guardadas por tipo (fallback seguro)
// ======================================================================
r.get(
  "/recipes-by-type",
  asyncHandler(async (_req, res) => {
    try {
      const rows1 = await prisma.$queryRaw<
        { planType: string | null; generated: bigint; saved: bigint }[]
      >`
        SELECT
          COALESCE(planType,'GENERAL') AS planType,
          COUNT(*) AS generated,
          SUM(CASE WHEN (saved = 1 OR saved = 'true') THEN 1 ELSE 0 END) AS saved
        FROM Recipe
        GROUP BY planType
        ORDER BY generated DESC
      `;
      return res.json(
        rows1.map((r) => ({
          planType: r.planType ?? "GENERAL",
          generated: Number(r.generated || 0n),
          saved: Number(r.saved || 0n),
        }))
      );
    } catch {
      return res.json([]);
    }
  })
);

export default r;
