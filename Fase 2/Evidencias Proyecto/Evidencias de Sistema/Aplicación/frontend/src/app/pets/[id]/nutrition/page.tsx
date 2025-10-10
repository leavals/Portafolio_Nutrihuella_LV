"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button, Card, Input, Select } from "@/components/ui";

type Nutrition = {
  dietType?: string;
  mealsPerDay?: number;
  activityLevel?: string;
  goal?: string;
  preferredFoods?: string[];
  forbiddenFoods?: string[];
  intolerances?: string[];
  foodAllergies?: string[];
  supplements?: string[];
  dailyCalories?: number | null;
  waterIntakeMl?: number | null;
  notes?: string | null;
};

const toCSV = (a?: string[]) => (a && a.length ? a.join(", ") : "");
const toArr = (s: string) => s.split(",").map(v => v.trim()).filter(Boolean);

export default function NutritionPage() {
  const params = useParams<{ id: string }>();
  const petId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();

  const [form, setForm] = useState<Nutrition | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!petId) return;
    (async () => {
      setLoading(true);
      setMsg(null);
      setErr(null);
      try {
        const data = await api.get<Nutrition | null>(`/api/pets/${petId}/nutrition`);
        const defaults: Nutrition = {
          dietType: "MIXED",
          mealsPerDay: 2,
          activityLevel: "MODERATE",
          goal: "MAINTENANCE",
          preferredFoods: [],
          forbiddenFoods: [],
          intolerances: [],
          foodAllergies: [],
          supplements: [],
          dailyCalories: null,
          waterIntakeMl: null,
          notes: null,
        };

        setForm({ ...defaults, ...data });
      } catch (e: any) {
        setErr(e?.message || "No se pudo cargar la ficha nutricional");
      } finally {
        setLoading(false);
      }
    })();
  }, [petId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!petId || !form) return;
    setMsg(null);
    setErr(null);

    try {
      await api.put(`/api/pets/${petId}/nutrition`, {
        dietType: (document.getElementById("n_diet") as HTMLSelectElement).value || undefined,
        mealsPerDay: (document.getElementById("n_meals") as HTMLInputElement).value
          ? Number((document.getElementById("n_meals") as HTMLInputElement).value)
          : undefined,
        activityLevel: (document.getElementById("n_activity") as HTMLSelectElement).value || undefined,
        goal: (document.getElementById("n_goal") as HTMLSelectElement).value || undefined,
        preferredFoods: toArr((document.getElementById("n_pref") as HTMLInputElement).value) || undefined,
        forbiddenFoods: toArr((document.getElementById("n_forb") as HTMLInputElement).value) || undefined,
        intolerances: toArr((document.getElementById("n_intol") as HTMLInputElement).value) || undefined,
        foodAllergies: toArr((document.getElementById("n_allerg") as HTMLInputElement).value) || undefined,
        supplements: toArr((document.getElementById("n_suppl") as HTMLInputElement).value) || undefined,
        dailyCalories: (document.getElementById("n_cal") as HTMLInputElement).value
          ? Number((document.getElementById("n_cal") as HTMLInputElement).value)
          : undefined,
        waterIntakeMl: (document.getElementById("n_water") as HTMLInputElement).value
          ? Number((document.getElementById("n_water") as HTMLInputElement).value)
          : undefined,
        notes: (document.getElementById("n_notes") as HTMLTextAreaElement).value || undefined,
      });

      setMsg("Ficha nutricional guardada correctamente.");

      // Redirigir automáticamente a enfermedades
      router.push(`/pets/${petId}/diseases`);
    } catch (e: any) {
      setErr(e?.message || "No se pudo guardar");
    }
  }

  if (!petId) return <p className="text-sm text-slate-500">Ruta inválida.</p>;
  if (loading || !form) return <p className="text-sm text-slate-500">Cargando…</p>;

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <Link href={`/pets/${petId}`}>
          <Button variant="primary" className="text-white">
            ← Volver
          </Button>
        </Link>
      </div>

      <Card>
        <div className="p-4">
          <h1 className="text-2xl font-semibold mt-2">Ficha nutricional</h1>
        </div>
      </Card>

      <Card>
        <form onSubmit={save} className="grid md:grid-cols-2 gap-4 p-4" noValidate>
          {/* Tipo de dieta */}
          <div className="flex items-center gap-4">
            <label htmlFor="n_diet" className="w-36 text-sm font-medium">
              Tipo de dieta
            </label>
            <Select id="n_diet" defaultValue={form.dietType ?? "RAW"} className="flex-1">
              <option value="RAW">Cruda</option>
              <option value="COOKED">Cocinada</option>
              <option value="COMMERCIAL">Comercial</option>
              <option value="MIXED">Mixta</option>
            </Select>
          </div>

          {/* Comidas/día */}
          <div className="flex items-center gap-4">
            <label htmlFor="n_meals" className="w-36 text-sm font-medium">
              Comidas/día
            </label>
            <Input
              id="n_meals"
              type="number"
              min={1}
              max={6}
              defaultValue={form.mealsPerDay ?? 2}
              className="w-28"
            />
          </div>

          {/* Actividad */}
          <div className="flex items-center gap-4">
            <label htmlFor="n_activity" className="w-36 text-sm font-medium">
              Actividad
            </label>
            <Select id="n_activity" defaultValue={form.activityLevel ?? "MODERATE"} className="flex-1">
              <option value="LOW">Baja</option>
              <option value="MODERATE">Moderada</option>
              <option value="HIGH">Alta</option>
            </Select>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4">
            <label htmlFor="n_goal" className="w-36 text-sm font-medium">
              Meta
            </label>
            <Select id="n_goal" defaultValue={form.goal ?? "MAINTENANCE"} className="flex-1">
              <option value="MAINTENANCE">Mantención</option>
              <option value="GAIN">Subir peso</option>
              <option value="LOSS">Bajar peso</option>
            </Select>
          </div>

          {/* Preferidos (CSV) */}
          <div className="flex items-center gap-4">
            <label htmlFor="n_pref" className="w-36 text-sm font-medium">
              Preferidos (CSV)
            </label>
            <Input id="n_pref" defaultValue={toCSV(form.preferredFoods)} placeholder="pollo, zanahoria" className="flex-1" />
          </div>

          {/* Prohibidos (CSV) */}
          <div className="flex items-center gap-4">
            <label htmlFor="n_forb" className="w-36 text-sm font-medium">
              Prohibidos (CSV)
            </label>
            <Input id="n_forb" defaultValue={toCSV(form.forbiddenFoods)} placeholder="chocolate, uva" className="flex-1" />
          </div>

          {/* Intolerancias (CSV) */}
          <div className="flex items-center gap-4">
            <label htmlFor="n_intol" className="w-36 text-sm font-medium">
              Intolerancias (CSV)
            </label>
            <Input id="n_intol" defaultValue={toCSV(form.intolerances)} placeholder="lactosa" className="flex-1" />
          </div>

          {/* Alergias alimentarias (CSV) */}
          <div className="flex items-center gap-4">
            <label htmlFor="n_allerg" className="w-36 text-sm font-medium">
              Alergias alimentarias (CSV)
            </label>
            <Input id="n_allerg" defaultValue={toCSV(form.foodAllergies)} placeholder="gluten" className="flex-1" />
          </div>

          {/* Suplementos (CSV) */}
          <div className="flex items-center gap-4">
            <label htmlFor="n_suppl" className="w-36 text-sm font-medium">
              Suplementos (CSV)
            </label>
            <Input id="n_suppl" defaultValue={toCSV(form.supplements)} placeholder="omega 3" className="flex-1" />
          </div>

          {/* Calorías diarias */}
          <div className="flex items-center gap-4">
            <label htmlFor="n_cal" className="w-36 text-sm font-medium">
              Calorías diarias
            </label>
            <Input id="n_cal" type="number" step={1} min={0} defaultValue={form.dailyCalories ?? ""} className="w-36" />
          </div>

          {/* Agua (ml) */}
          <div className="flex items-center gap-4">
            <label htmlFor="n_water" className="w-36 text-sm font-medium">
              Agua (ml)
            </label>
            <Input id="n_water" type="number" step={1} min={0} defaultValue={form.waterIntakeMl ?? ""} className="w-36" />
          </div>

          {/* Notas (span across) */}
          <div className="md:col-span-2">
            <label htmlFor="n_notes" className="block text-sm font-medium mb-1">
              Notas
            </label>
            <textarea id="n_notes" defaultValue={form.notes ?? ""} className="input w-full h-24" />
          </div>

          {msg && (
            <div className="md:col-span-2 text-sm text-green-700" aria-live="polite">
              {msg}
            </div>
          )}
          {err && (
            <div className="md:col-span-2 text-sm text-red-600" aria-live="polite">
              {err}
            </div>
          )}

          <div className="md:col-span-2">
            <Button type="submit">Guardar nutrición</Button>
          </div>
        </form>
      </Card>

      
    </div>
  );
}
