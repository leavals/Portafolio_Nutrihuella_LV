// src/config/nutrition-defaults.ts
export type SizeKey = "TOY" | "SMALL" | "MEDIUM" | "LARGE" | "GIANT";

type NutritionDefaults = {
  dietType: "RAW" | "COOKED" | "COMMERCIAL" | "MIXED";
  mealsPerDay: number;
  activityLevel: "LOW" | "MODERATE" | "HIGH";
  goal: "MAINTENANCE" | "GAIN" | "LOSS";
  kcalPerKg?: number;        // si hay peso: dailyCalories = kcalPerKg * peso (limitado por min/max)
  minDailyCalories?: number;
  maxDailyCalories?: number;
  waterMlPerKg?: number;     // si hay peso: waterIntakeMl = waterMlPerKg * peso
};

export const NUTRITION_DEFAULTS_BY_SIZE: Record<SizeKey, NutritionDefaults> = {
  TOY:    { dietType: "MIXED", mealsPerDay: 2, activityLevel: "MODERATE", goal: "MAINTENANCE", kcalPerKg: 80,  minDailyCalories: 120, maxDailyCalories: 600,  waterMlPerKg: 60 },
  SMALL:  { dietType: "MIXED", mealsPerDay: 2, activityLevel: "MODERATE", goal: "MAINTENANCE", kcalPerKg: 70,  minDailyCalories: 200, maxDailyCalories: 900,  waterMlPerKg: 55 },
  MEDIUM: { dietType: "MIXED", mealsPerDay: 2, activityLevel: "MODERATE", goal: "MAINTENANCE", kcalPerKg: 55,  minDailyCalories: 300, maxDailyCalories: 1400, waterMlPerKg: 50 },
  LARGE:  { dietType: "MIXED", mealsPerDay: 2, activityLevel: "MODERATE", goal: "MAINTENANCE", kcalPerKg: 45,  minDailyCalories: 400, maxDailyCalories: 2200, waterMlPerKg: 45 },
  GIANT:  { dietType: "MIXED", mealsPerDay: 2, activityLevel: "MODERATE", goal: "MAINTENANCE", kcalPerKg: 40,  minDailyCalories: 500, maxDailyCalories: 3000, waterMlPerKg: 40 },
};

/** Normaliza a SizeKey; fallback MEDIUM si viene algo raro. */
export function normalizeSize(sizeRaw: unknown): SizeKey {
  const s = String(sizeRaw ?? "MEDIUM").toUpperCase();
  const keys: SizeKey[] = ["TOY","SMALL","MEDIUM","LARGE","GIANT"];
  return (keys as string[]).includes(s) ? (s as SizeKey) : "MEDIUM";
}

/** Calcula defaults dinámicos por tamaño/peso. */
export function computeNutritionDefaults(args: { size?: unknown; weightKg?: unknown }) {
  const size = normalizeSize(args.size);
  const profile = NUTRITION_DEFAULTS_BY_SIZE[size];

  const w = Number(args.weightKg ?? 0);
  let dailyCalories: number | null = null;
  if (profile.kcalPerKg && w > 0) {
    const kcal = Math.round(profile.kcalPerKg * w);
    const min = profile.minDailyCalories ?? 100;
    const max = profile.maxDailyCalories ?? 5000;
    dailyCalories = Math.min(Math.max(kcal, min), max);
  }

  let waterIntakeMl: number | null = null;
  if (profile.waterMlPerKg && w > 0) {
    waterIntakeMl = Math.round(profile.waterMlPerKg * w);
  }

  return {
    dietType: profile.dietType,
    mealsPerDay: profile.mealsPerDay,
    activityLevel: profile.activityLevel,
    goal: profile.goal,

    preferredFoods: [] as string[],
    forbiddenFoods: [] as string[],
    intolerances: [] as string[],
    foodAllergies: [] as string[],
    supplements: [] as string[],

    dailyCalories,   // puede ser null si no hay peso
    waterIntakeMl,   // puede ser null si no hay peso
    notes: null as string | null,
  };
}

/** Mezcla segura: defaults → override (respeta arrays vacíos del usuario). */
export function mergeNutritionDefaults<T extends Record<string, any>>(defaults: T, override: Partial<T>): T {
  const out: any = { ...defaults };
  for (const k of Object.keys(override ?? {})) {
    out[k] = (override as any)[k];
  }
  return out;
}
