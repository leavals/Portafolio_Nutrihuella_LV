// src/lib/analytics.ts
// Wrapper tipado para la UI del dashboard.

"use client";
import api from "@/lib/api";

export type HeatCell = { day: number; hour: number; value: number };

export type Summary = {
  totals: {
    users: number;
    pets: number;
    dogs: number;
    cats: number;
    favorites: number;
    pantryItems: number;
    plusCount: number;
    basicCount: number;
    active7: number;
    active30: number;
    active90: number;
  };
  kpis: {
    petsPerUser: number;
    favoritesPerUser: number;
    pantryPerUser: number;
    dogSharePct: number;
    catSharePct: number;
    active7dPct: number;
    active30dPct: number;
    plusSharePct: number;
    basicSharePct: number;
  };
};

export type UsersByMonth = { month: string; users: number; active: number };
export type GeoRow = { label: string; count: number; type: "commune" | "region" };
export type PantryTop = { item: string; count: number };
export type SpeciesRow = { species: string; count: number };
export type RecipesByType = { planType: string; generated: number; saved: number };
export type PlusTenure = { userId: string; name: string; email: string; days: number; since: string };

// Helpers seguros
const asNum = (v: unknown, f = 0) => (Number.isFinite(Number(v)) ? Number(v) : f);

// ===== Endpoints =====
async function summary(): Promise<Summary> {
  return await api.get<Summary>("/api/analytics/summary");
}

async function usersByMonth(year?: number): Promise<UsersByMonth[]> {
  const qs = year ? `?year=${year}` : "";
  const resp = await api.get<any>(`/api/analytics/users-by-month${qs}`);

  // Soporta tanto arreglo [{month,users,active}] como forma {months,signups}
  if (Array.isArray(resp)) {
    return resp.map((r) => ({
      month: String(r.month),
      users: asNum((r as any).users),
      active: asNum((r as any).active),
    }));
  }
  if (resp?.months && resp?.signups) {
    return (resp.months as string[]).map((m: string, i: number) => ({
      month: m,
      users: asNum(resp.signups[i]),
      active: asNum(resp.actives?.[i] ?? 0),
    }));
  }
  return [];
}

async function geography(): Promise<GeoRow[]> {
  return await api.get<GeoRow[]>("/api/analytics/geography");
}

async function pantryTop(): Promise<{ label: string; value: number }[]> {
  const rows = await api.get<PantryTop[]>("/api/analytics/pantry-top");
  return rows.map((r) => ({ label: r.item, value: asNum(r.count) }));
}

async function species(): Promise<SpeciesRow[]> {
  return await api.get<SpeciesRow[]>("/api/analytics/species");
}

async function recipesByType(): Promise<RecipesByType[]> {
  return await api.get<RecipesByType[]>("/api/analytics/recipes-by-type");
}

async function plusTopTenure(): Promise<PlusTenure[]> {
  return await api.get<PlusTenure[]>("/api/analytics/plus-top-tenure");
}

async function hoursHeatmap(month?: string): Promise<HeatCell[]> {
  const qs = month ? `?month=${encodeURIComponent(month)}` : "";
  try {
    return await api.get<HeatCell[]>(`/api/analytics/hours-heatmap${qs}`);
  } catch {
    return [];
  }
}

const AnalyticsAPI = {
  summary,
  usersByMonth,
  geography,
  pantryTop,
  species,
  recipesByType,
  plusTopTenure,
  hoursHeatmap,
};

export { AnalyticsAPI };
export type { UsersByMonth, GeoRow, PantryTop, SpeciesRow, RecipesByType, PlusTenure };
