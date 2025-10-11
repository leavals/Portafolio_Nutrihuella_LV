// src/controllers/recipes.controller.ts
import type { Request, Response } from "express";
import { prisma } from "../services/prisma.ts";
import { chatJSON } from "../services/ollama.ts";

type PlanType = "BREAKFAST" | "LUNCH" | "DINNER" | "DAILY" | "WEEKLY";

function parseCsvOrJson(txt?: string | null): string[] {
  if (!txt) return [];
  // Intentar JSON (por si está guardado como '["pollo","gluten"]')
  try {
    const v = JSON.parse(txt);
    if (Array.isArray(v)) return v.map((x) => String(x));
  } catch {}
  // Fallback CSV
  return String(txt)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function yearsFrom(birth?: Date | null): number | null {
  if (!birth) return null;
  const ms = Date.now() - birth.getTime();
  if (ms <= 0) return 0;
  // 365.25 días
  return Math.round((ms / 31557600000) * 10) / 10;
}

export async function generateRecipe(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string | undefined;

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

    // Aceptar aliases de petId
    const effectivePetId = String(petIdBody || pet_id || petProfileIn?.id || "");

    // 1) Construir petProfile si no vino embebido
    let petProfile = petProfileIn as any;
    if (!petProfile && effectivePetId) {
      const pet = await prisma.pet.findFirst({
        where: {
          id: effectivePetId,
          ...(userId ? { ownerId: userId } : {}), // si hay user, debe ser su mascota
        },
        include: {
          nutrition: true,
          diseases: true,
          vaccines: true,
          weights: { orderBy: { date: "desc" }, take: 6 },
        },
      });
      if (!pet) {
        return res.status(404).json({ message: "Mascota no encontrada" });
      }

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
        // Alergias/intolerancias/forbidden de la ficha nutricional (guardadas como CSV/JSON-string)
        allergies: parseCsvOrJson(pet.nutrition?.foodAllergies),
        diseases: (pet.diseases ?? []).map((d) => d.name),
        vaccines: (pet.vaccines ?? []).map((v) => v.name),
        lastWeights: (pet.weights ?? []).map((w) => ({ date: w.date, kg: w.weightKg })),
        nutritionNotes: pet.nutrition?.notes ?? "",
      };
    }

    if (!petProfile?.id) {
      // Mantener mensaje esperado por el frontend
      return res.status(400).json({ message: "Debe seleccionar una mascota." });
    }

    // 2) Armar "pantry"
    let pantry: Array<{ name: string; quantity?: number; unit?: string }> = [];
    // Si vino en el body, lo usamos
    if (Array.isArray(pantryIn) && pantryIn.length) {
      pantry = pantryIn.map((i) => ({
        name: i.name ?? "",
        quantity: typeof i.quantity === "number" ? i.quantity : undefined,
        unit: i.unit ?? undefined,
      }));
    } else {
      // Si no vino pantry, y el usuario está logueado y pide usar despensa, la cargamos de DB
      const shouldUsePantry = (use_pantry ?? usePantry ?? true) && !!userId;
      if (shouldUsePantry) {
        const items = await prisma.pantryItem.findMany({
          where: { ownerId: userId! },
          orderBy: [{ expiresAt: "asc" }, { name: "asc" }],
        });
        pantry = items.map((it) => ({
          name: it.name,
          quantity: typeof it.quantity === "number" ? it.quantity : undefined,
          unit: it.unit ?? undefined,
        }));
      }
    }

    // 3) Prompt a la IA (Ollama) – pedir JSON estricto
    const sys = [
      "Eres NutriHuella, asistente de nutrición para mascotas.",
      "Devuelve SOLO JSON válido, sin comentarios, sin texto adicional.",
      "Si falta información, asume valores razonables y menciónalo en 'notes'.",
    ].join(" ");

    const user = `
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
  "disclaimer": "Estos resultados son solo de referencia y no deben tratarse como base para un tratamiento médico..."
}

Contexto mascota: ${JSON.stringify(petProfile)}
Despensa: ${JSON.stringify(pantry)}
Objetivos: ${goals}
    `.trim();

    const raw = await chatJSON(sys, user);

    let recipe: any;
    try {
      recipe = JSON.parse(raw);
    } catch {
      // Si el modelo no respetó JSON estricto, devolvemos algo utilizable
      recipe = { title: "Receta generada", planType, notes: "Respuesta no-JSON", raw };
    }

    return res.json({ recipe, recipeId: null });
  } catch (err: any) {
    console.error("generateRecipe error:", err?.message || err);
    return res.status(500).json({ message: "No fue posible generar la receta." });
  }
}

export async function addFavorite(_req: Request, res: Response) {
  return res.json({ ok: true });
}

export async function sendFeedback(_req: Request, res: Response) {
  return res.json({ ok: true });
}
