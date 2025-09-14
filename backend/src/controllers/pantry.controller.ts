// backend/src/controllers/pantry.controller.ts
import { Request, Response } from "express";
import { prisma } from "../services/prisma.js";

function norm(s?: string | null) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function splitCsv(s?: string | null) {
  return norm(s)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

async function assertPetOfUser(petId: string, userId: string) {
  const pet = await prisma.pet.findFirst({
    where: { id: petId, ownerId: userId },
    include: { nutrition: true },
  });
  if (!pet) {
    const e: any = new Error("Mascota no encontrada");
    e.status = 404;
    throw e;
  }
  return pet;
}

/** GET /api/pantry — Lista general por usuario */
export async function pantryList(req: Request, res: Response) {
  const userId = (req as any).user?.id ?? (req as any).userId;
  const items = await prisma.pantryItem.findMany({
    where: { ownerId: userId },
    orderBy: [{ expiresAt: "asc" }, { name: "asc" }],
  });
  res.json(items);
}

/** POST /api/pantry — Crear ingrediente */
export async function pantryCreate(req: Request, res: Response) {
  const userId = (req as any).user?.id ?? (req as any).userId;
  const { name, keywordsCsv, ...rest } = req.body;
  const item = await prisma.pantryItem.create({
    data: {
      ownerId: userId,
      name,
      normalized: norm(name),
      keywordsCsv,
      ...rest,
    },
  });
  res.status(201).json(item);
}

/** PATCH /api/pantry/:itemId — Actualizar */
export async function pantryUpdate(req: Request, res: Response) {
  const userId = (req as any).user?.id ?? (req as any).userId;
  const id = req.params.itemId;
  const exists = await prisma.pantryItem.findFirst({
    where: { id, ownerId: userId },
  });
  if (!exists) return res.status(404).json({ message: "Ingrediente no encontrado" });

  const { name, keywordsCsv, ...rest } = req.body;
  const updated = await prisma.pantryItem.update({
    where: { id },
    data: {
      ...(name ? { name, normalized: norm(name) } : {}),
      ...(keywordsCsv !== undefined ? { keywordsCsv } : {}),
      ...rest,
    },
  });
  res.json(updated);
}

/** DELETE /api/pantry/:itemId — Eliminar */
export async function pantryDelete(req: Request, res: Response) {
  const userId = (req as any).user?.id ?? (req as any).userId;
  const id = req.params.itemId;
  const exists = await prisma.pantryItem.findFirst({
    where: { id, ownerId: userId },
  });
  if (!exists) return res.status(404).json({ message: "Ingrediente no encontrado" });

  await prisma.pantryItem.delete({ where: { id } });
  res.json({ ok: true });
}

/** GET /api/pantry/expiring?days=3 — Próximos a vencer */
export async function pantryExpiring(req: Request, res: Response) {
  const userId = (req as any).user?.id ?? (req as any).userId;
  const days = Number(req.query.days ?? 3);
  const limit = new Date(Date.now() + days * 86400000);
  const items = await prisma.pantryItem.findMany({
    where: { ownerId: userId, expiresAt: { not: null, lte: limit } },
    orderBy: { expiresAt: "asc" },
  });
  res.json({ days, items });
}

/** GET /api/pantry/summary — Resumen por categoría (para IA) */
export async function pantrySummary(req: Request, res: Response) {
  const userId = (req as any).user?.id ?? (req as any).userId;
  const items = await prisma.pantryItem.findMany({ where: { ownerId: userId } });

  const byCategory: Record<string, { count: number; totalQty: number; units: string[] }> = {};
  for (const it of items) {
    const cat = (it.category ?? "OTROS").toUpperCase();
    byCategory[cat] ??= { count: 0, totalQty: 0, units: [] };
    byCategory[cat].count++;
    if (typeof it.quantity === "number") byCategory[cat].totalQty += it.quantity;
    if (it.unit && !byCategory[cat].units.includes(it.unit)) byCategory[cat].units.push(it.unit);
  }
  res.json({ totalItems: items.length, categories: byCategory });
}

/** GET /api/pantry/usable/:petId — Filtra aptos/prohibidos según ficha de mascota */
export async function pantryForPet(req: Request, res: Response) {
  const userId = (req as any).user?.id ?? (req as any).userId;
  const petId = req.params.petId || req.params.id;
  const pet = await assertPetOfUser(petId, userId);

  const items = await prisma.pantryItem.findMany({ where: { ownerId: userId } });

  const forbidden = new Set([
    ...splitCsv(pet.nutrition?.forbiddenFoods),
    ...splitCsv(pet.nutrition?.foodAllergies),
    ...splitCsv(pet.nutrition?.intolerances),
  ]);
  const preferred = new Set(splitCsv(pet.nutrition?.preferredFoods));

  function itemTokens(it: any) {
    const toks = new Set<string>();
    toks.add(norm(it.name));
    norm(it.keywordsCsv)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((t) => toks.add(t));
    return toks;
  }

  const aptos: any[] = [];
  const prohibidos: any[] = [];

  for (const it of items) {
    const toks = itemTokens(it);
    const isForbidden = [...toks].some((t) => forbidden.has(t));
    if (isForbidden) {
      prohibidos.push(it);
      continue;
    }
    aptos.push({ ...it, preferred: [...toks].some((t) => preferred.has(t)) });
  }

  res.json({
    pet: { id: pet.id, name: pet.name },
    counts: { aptos: aptos.length, prohibidos: prohibidos.length },
    aptos,
    prohibidos,
  });
}
