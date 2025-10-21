// src/controllers/limits.controller.ts
import type { Request, Response } from "express";
import { prisma } from "../services/prisma.ts";

function santiagoDateKey(d = new Date()): { dateKey: string; resetAtISO: string } {
  // Obtener YYYY-MM-DD en America/Santiago
  const fmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(d);
  const y = parts.find(p => p.type === "year")!.value;
  const m = parts.find(p => p.type === "month")!.value;
  const da = parts.find(p => p.type === "day")!.value;
  const dateKey = `${y}-${m}-${da}`;

  // Próxima medianoche en America/Santiago
  const nowStr = d.toLocaleString("en-US", { timeZone: "America/Santiago" });
  const now = new Date(nowStr);
  const reset = new Date(now);
  reset.setHours(24, 0, 0, 0);
  const resetAtISO = reset.toISOString();
  return { dateKey, resetAtISO };
}

export async function getLimits(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const isPlus = (user.plan || "BASIC").toUpperCase() === "PLUS";

    const [petsUsed, favsUsed] = await Promise.all([
      prisma.pet.count({ where: { ownerId: userId } }),
      prisma.favoriteRecipe.count({ where: { userId } }),
    ]);

    const { dateKey, resetAtISO } = santiagoDateKey();
    const stat = await prisma.dailyStat.findUnique({
      where: { userId_dateKey: { userId, dateKey } },
    });

    const BASIC = { pets: 2, favorites: 2, generations: 2 };
    const limits = isPlus
      ? { pets: 999999, favorites: 999999, generations: 999999 }
      : { pets: BASIC.pets, favorites: BASIC.favorites, generations: BASIC.generations };

    return res.json({
      plan: isPlus ? "PLUS" : "BASIC",
      pets: { used: petsUsed, limit: limits.pets },
      favorites: { used: favsUsed, limit: limits.favorites },
      generationsToday: {
        used: stat?.recipesGeneratedCount ?? 0,
        limit: limits.generations,
        resetAt: resetAtISO,
      },
    });
  } catch (e: any) {
    console.error("getLimits error:", e);
    return res.status(500).json({ message: "No fue posible obtener los límites" });
  }
}
