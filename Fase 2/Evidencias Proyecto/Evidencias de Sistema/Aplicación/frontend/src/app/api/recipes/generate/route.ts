// app/api/recipes/generate/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

type MealType = "breakfast" | "lunch" | "dinner" | "day" | "week";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

    const { petId, goal = "", mealType = "day", extra = "" } = body as {
      petId?: string; goal?: string; mealType?: MealType; extra?: string;
    };
    if (!petId) return NextResponse.json({ error: "Falta petId" }, { status: 400 });

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { recipe: buildMockRecipe({ mealType, goal, extra }), note: "MOCK: falta OPENAI_API_KEY" },
        { status: 200 }
      );
    }

    // TODO: IA real aquí
    return NextResponse.json({ recipe: buildMockRecipe({ mealType, goal, extra }) }, { status: 200 });
  } catch (err: any) {
    console.error("GENERATOR_ERROR:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function buildMockRecipe({ mealType, goal, extra }:{
  mealType: MealType; goal: string; extra: string;
}) {
  const title =
    mealType === "week" ? "Plan semanal casero"
    : mealType === "day" ? "Menú del día"
    : `Menú de ${mealType}`;

  return {
    title,
    goal,
    constraints: extra,
    meals:
      mealType === "day" || mealType === "week"
        ? [
            { name: "Desayuno", items: ["Avena", "Manzana", "Yogurt"] },
            { name: "Almuerzo",  items: ["Arroz integral", "Pavo", "Zanahoria"] },
            { name: "Cena",      items: ["Camote", "Atún al agua", "Espinaca"] },
          ]
        : [{ name: mealType, items: ["Arroz integral", "Pollo cocido", "Zanahoria"] }],
    disclaimer: "Solo referencial. No sustituye consejo veterinario profesional.",
  };
}
