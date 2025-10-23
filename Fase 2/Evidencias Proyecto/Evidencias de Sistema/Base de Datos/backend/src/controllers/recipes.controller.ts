// src/controllers/recipes.controller.ts
/**
 * Controladores de recetas:
 * - generateRecipe: genera un plan con Ollama y aplica límites diarios.
 * - addFavorite: guarda una receta en favoritos con límite por plan.
 * - listFavorites: lista favoritos del usuario autenticado.
 * - deleteFavorite: elimina un favorito propio.
 */
import type { Request, Response } from "express";
import { prisma } from "../services/prisma.ts";
import { chatJSON } from "../services/ollama.ts";

type PlanType = "BREAKFAST" | "LUNCH" | "DINNER" | "DAILY" | "WEEKLY";

const LIMITS = {
  BASIC: { pets: 2, favorites: 2, generationsPerDay: 2 },
  PLUS:  { pets: 999999, favorites: 999999, generationsPerDay: 999999 },
} as const;

function getPlan(userPlan?: string) {
  return (userPlan === "PLUS" ? "PLUS" : "BASIC") as keyof typeof LIMITS;
}

function santiagoDateKey(d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find(p => p.type === "year")!.value;
  const m = parts.find(p => p.type === "month")!.value;
  const day = parts.find(p => p.type === "day")!.value;
  return `${y}-${m}-${day}`;
}

function santiagoResetAtISO(d = new Date()) {
  // Próxima medianoche en America/Santiago → ISO UTC aproximado
  const dateKey = santiagoDateKey(d);
  const [Y, M, D] = dateKey.split("-").map(Number);
  const next = new Date(Date.UTC(Y, M - 1, D + 1, 3, 0, 0));
  return next.toISOString();
}

function limitErr(res: Response, http: number, code: string, used: number, limit: number, withReset = false) {
  const payload: any = {
    message: "Límite alcanzado.",
    code,
    quota: { used, limit, ...(withReset ? { resetAt: santiagoResetAtISO() } : {}) },
  };
  return res.status(http).json(payload);
}

function parseCsvOrJson(txt?: string | null): string[] {
  if (!txt) return [];
  try {
    const v = JSON.parse(txt);
    if (Array.isArray(v)) return v.map(String);
  } catch {}
  return String(txt).split(",").map((s) => s.trim()).filter(Boolean);
}

function yearsFrom(birth?: Date | null): number | null {
  if (!birth) return null;
  const ms = Date.now() - birth.getTime();
  if (ms <= 0) return 0;
  return Math.round((ms / 31557600000) * 10) / 10; // 365.25 días
}

/* ====================== GENERATE ====================== */

export async function generateRecipe(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const plan = getPlan(user.plan);
    const genLimit = LIMITS[plan].generationsPerDay;

    // Límite diario
    const dateKey = santiagoDateKey();
    let stat = await prisma.dailyStat.findUnique({
      where: { userId_dateKey: { userId, dateKey } },
    });
    const used = stat?.recipesGeneratedCount ?? 0;
    if (used >= genLimit) {
      return limitErr(res, 429, "LIMIT_GENERATIONS_REACHED", used, genLimit, true);
    }

    // Entrada
    const {
      planType = "DAILY",
      goals = "",
      petId: petIdBody,
      pet_id,
      petProfile: petProfileIn,
      usePantry = true,
      use_pantry,
      pantry: pantryIn,
    } = (req.body ?? {}) as {
      planType?: PlanType;
      goals?: string;
      petId?: string;
      pet_id?: string;
      petProfile?: any;
      usePantry?: boolean;
      use_pantry?: boolean;
      pantry?: Array<{ name: string; quantity?: number; unit?: string }>;
    };

    const effectivePetId = String(petIdBody || pet_id || petProfileIn?.id || "");

    // Construir perfil de mascota si no viene embebido
    let petProfile = petProfileIn as any;
    if (!petProfile && effectivePetId) {
      const pet = await prisma.pet.findFirst({
        where: { id: effectivePetId, ownerId: userId },
        include: {
          nutrition: true,
          diseases: true,
          vaccines: true,
          weights: { orderBy: { date: "desc" }, take: 6 },
        },
      });
      if (!pet) return res.status(404).json({ message: "Mascota no encontrada" });

      petProfile = {
        id: pet.id,
        name: pet.name,
        species: pet.species ?? "DOG",
        breed: pet.breed ?? "",
        ageYears: yearsFrom(pet.birthDate),
        weightKg: pet.weightKg ?? null,
        sex: pet.sex ?? "",
        sterilized: !!pet.sterilized,
        size: pet.size ?? "",
        activityLevel: pet.nutrition?.activityLevel ?? "",
        allergies: parseCsvOrJson(pet.nutrition?.foodAllergies),
        diseases: (pet.diseases ?? []).map((d) => d.name),
        vaccines: (pet.vaccines ?? []).map((v) => v.name),
        lastWeights: (pet.weights ?? []).map((w) => ({ date: w.date, kg: w.weightKg })),
        nutritionNotes: pet.nutrition?.notes ?? "",
      };
    }
    if (!petProfile?.id) {
      return res.status(400).json({ message: "Debe seleccionar una mascota." });
    }

    // Pantry
    let pantry: Array<{ name: string; quantity?: number; unit?: string }> = [];
    if (Array.isArray(pantryIn) && pantryIn.length) {
      pantry = pantryIn.map((i) => ({
        name: i.name ?? "",
        quantity: typeof i.quantity === "number" ? i.quantity : undefined,
        unit: i.unit ?? undefined,
      }));
    } else {
      const shouldUsePantry = (use_pantry ?? usePantry ?? true);
      if (shouldUsePantry) {
        const items = await prisma.pantryItem.findMany({
          where: { ownerId: userId },
          orderBy: [{ expiresAt: "asc" }, { name: "asc" }],
        });
        pantry = items.map((it) => ({
          name: it.name,
          quantity: typeof it.quantity === "number" ? it.quantity : undefined,
          unit: it.unit ?? undefined,
        }));
      }
    }

    // Prompt
    const sys = [
      "Eres NutriHuella, asistente de nutrición para mascotas.",
      "Devuelve SOLO JSON válido, sin comentarios, sin texto adicional.",
      "Si falta información, asume valores razonables y menciónalo en 'notes'.",
    ].join(" ");

    const userMsg = `
Genera un plan "${planType}" para la mascota y su contexto. Considera objetivos/restricciones y la despensa disponible.

Estructura JSON estricta:
{
  "title": "string",
  "planType": "BREAKFAST|LUNCH|DINNER|DAILY|WEEKLY",
  "totalDailyKcal": 0,
  "meals": [{
    "name": "string",
    "kcal":  0,
    "ingredients": [{"name":"string","qty":0,"unit":"g|ml|unid"}],
    "instructions": "string"
  }],
  "macros": {"protein_g": 0, "fat_g": 0, "carbs_g": 0},
  "shoppingList": ["string"],
  "warnings": ["string"],
  "notes": "string",
  "disclaimer": "Estos resultados son solo de referencia y no deben tratarse como base..."
}

Contexto mascota: ${JSON.stringify(petProfile)}
Despensa: ${JSON.stringify(pantry)}
Objetivos: ${goals}
    `.trim();

    const raw = await chatJSON(sys, userMsg);

    let recipe: any;
    try {
      recipe = JSON.parse(raw);
    } catch {
      recipe = { title: "Receta generada", planType, notes: "Respuesta no-JSON", raw };
    }

    // Incremento de conteo diario
    await prisma.$transaction(async (tx) => {
      await tx.dailyStat.upsert({
        where: { userId_dateKey: { userId, dateKey } },
        update: { recipesGeneratedCount: { increment: 1 } },
        create: { userId, dateKey, recipesGeneratedCount: 1 },
      });
    });

    return res.json({ recipe, recipeId: null });
  } catch (err: any) {
    console.error("generateRecipe error:", err?.message || err);
    return res.status(500).json({ message: "No fue posible generar la receta." });
  }
}

/* ====================== FAVORITES ====================== */

export async function addFavorite(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const plan = getPlan(user.plan);
    const favLimit = LIMITS[plan].favorites;

    const used = await prisma.favoriteRecipe.count({ where: { userId } });
    if (used >= favLimit) {
      return limitErr(res, 409, "LIMIT_FAVORITES_REACHED", used, favLimit, false);
    }

    const { recipeId, recipe, title, planType, petId } = (req.body ?? {}) as {
      recipeId?: string;
      recipe?: any;
      title?: string;
      planType?: PlanType;
      petId?: string;
    };

    const payload = recipe ?? null;
    if (!payload) {
      return res.status(400).json({ message: "Falta el contenido de la receta a guardar." });
    }

    const created = await prisma.favoriteRecipe.create({
      data: {
        userId,
        petId: petId || null,
        title: title ?? payload?.title ?? null,
        planType: planType ?? payload?.planType ?? null,
        contentJson: JSON.stringify(payload),
      },
    });

    return res.status(201).json({ id: created.id });
  } catch (err: any) {
    console.error("addFavorite error:", err?.message || err);
    return res.status(500).json({ message: "No fue posible guardar en favoritos." });
  }
}

/** Lista favoritos del usuario autenticado. */
export async function listFavorites(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const rows = await prisma.favoriteRecipe.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        planType: true,
        createdAt: true,
        contentJson: true,
      },
    });

    const data = rows.map((r) => {
      let recipe: any = null;
      try { recipe = JSON.parse(r.contentJson); } catch { recipe = null; }
      return {
        id: r.id,
        title: r.title,
        planType: r.planType,
        createdAt: r.createdAt,
        recipe, // JSON parseado listo para frontend
      };
    });

    return res.json(data);
  } catch (err: any) {
    console.error("listFavorites error:", err?.message || err);
    return res.status(500).json({ message: "No fue posible listar favoritos." });
  }
}

/** Elimina un favorito propio. */
export async function deleteFavorite(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const id = String(req.params.id || "");
    if (!id) return res.status(400).json({ message: "ID requerido" });

    // Verificamos propiedad
    const row = await prisma.favoriteRecipe.findUnique({ where: { id } });
    if (!row || row.userId !== userId) return res.status(404).json({ message: "No encontrado" });

    await prisma.favoriteRecipe.delete({ where: { id } });
    return res.json({ ok: true });
  } catch (err: any) {
    console.error("deleteFavorite error:", err?.message || err);
    return res.status(500).json({ message: "No fue posible eliminar el favorito." });
  }
}
