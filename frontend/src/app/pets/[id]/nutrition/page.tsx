"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button, Card, Field, Input, Select } from "@/components/ui";

type Nutrition = {
  dietType?: string;       // RAW/COOKED/etc
  mealsPerDay?: number;
  activityLevel?: string;  // LOW/MODERATE/HIGH
  goal?: string;           // MAINTENANCE/GAIN/LOSS
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

  const [form, setForm] = useState<Nutrition | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!petId) return;
    (async () => {
      setLoading(true); setMsg(null); setErr(null);
      try {
        const data = await api.get<Nutrition | null>(`/api/pets/${petId}/nutrition`);
        setForm(data ?? {
          dietType: "RAW", mealsPerDay: 2, activityLevel: "MODERATE", goal: "MAINTENANCE",
          preferredFoods: [], forbiddenFoods: [], intolerances: [], foodAllergies: [], supplements: [],
          dailyCalories: null, waterIntakeMl: null, notes: null,
        });
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
    setMsg(null); setErr(null);
    try {
      await api.put(`/api/pets/${petId}/nutrition`, {
        dietType:      (document.getElementById("n_diet") as HTMLSelectElement).value,
        mealsPerDay:   Number((document.getElementById("n_meals") as HTMLInputElement).value || 2),
        activityLevel: (document.getElementById("n_activity") as HTMLSelectElement).value,
        goal:          (document.getElementById("n_goal") as HTMLSelectElement).value,
        preferredFoods: toArr((document.getElementById("n_pref") as HTMLInputElement).value),
        forbiddenFoods: toArr((document.getElementById("n_forb") as HTMLInputElement).value),
        intolerances:   toArr((document.getElementById("n_intol") as HTMLInputElement).value),
        foodAllergies:  toArr((document.getElementById("n_allerg") as HTMLInputElement).value),
        supplements:    toArr((document.getElementById("n_suppl") as HTMLInputElement).value),
        dailyCalories:  (document.getElementById("n_cal") as HTMLInputElement).value ? Number((document.getElementById("n_cal") as HTMLInputElement).value) : null,
        waterIntakeMl:  (document.getElementById("n_water") as HTMLInputElement).value ? Number((document.getElementById("n_water") as HTMLInputElement).value) : null,
        notes:          (document.getElementById("n_notes") as HTMLTextAreaElement).value || null,
      });
      setMsg("Ficha nutricional guardada correctamente.");
    } catch (e: any) {
      setErr(e?.message || "No se pudo guardar");
    }
  }

  if (!petId) return <p className="text-sm text-slate-500">Ruta inválida.</p>;
  if (loading || !form) return <p className="text-sm text-slate-500">Cargando…</p>;

  return (
    <div className="space-y-4">
      <Link href={`/pets/${petId}`} className="text-sm underline">← Volver</Link>
      <h1 className="text-2xl font-semibold">Ficha nutricional</h1>

      <Card>
        <form onSubmit={save} className="grid md:grid-cols-2 gap-4" noValidate>
          <Field label="Tipo de dieta">
            <Select id="n_diet" defaultValue={form.dietType ?? "RAW"}>
              <option value="RAW">Cruda</option>
              <option value="COOKED">Cocinada</option>
              <option value="KIBBLE">Concentrado</option>
              <option value="MIXED">Mixta</option>
            </Select>
          </Field>
          <Field label="Comidas/día">
            <Input id="n_meals" type="number" min="1" max="6" defaultValue={form.mealsPerDay ?? 2} />
          </Field>
          <Field label="Actividad">
            <Select id="n_activity" defaultValue={form.activityLevel ?? "MODERATE"}>
              <option value="LOW">Baja</option>
              <option value="MODERATE">Moderada</option>
              <option value="HIGH">Alta</option>
            </Select>
          </Field>
          <Field label="Meta">
            <Select id="n_goal" defaultValue={form.goal ?? "MAINTENANCE"}>
              <option value="MAINTENANCE">Mantención</option>
              <option value="GAIN">Subir peso</option>
              <option value="LOSS">Bajar peso</option>
            </Select>
          </Field>

          <Field label="Preferidos (CSV)">
            <Input id="n_pref" defaultValue={toCSV(form.preferredFoods)} placeholder="pollo, zanahoria" />
          </Field>
          <Field label="Prohibidos (CSV)">
            <Input id="n_forb" defaultValue={toCSV(form.forbiddenFoods)} placeholder="chocolate, uva" />
          </Field>
          <Field label="Intolerancias (CSV)">
            <Input id="n_intol" defaultValue={toCSV(form.intolerances)} placeholder="lactosa" />
          </Field>
          <Field label="Alergias alimentarias (CSV)">
            <Input id="n_allerg" defaultValue={toCSV(form.foodAllergies)} placeholder="gluten" />
          </Field>
          <Field label="Suplementos (CSV)">
            <Input id="n_suppl" defaultValue={toCSV(form.supplements)} placeholder="omega 3" />
          </Field>

          <Field label="Calorías diarias">
            <Input id="n_cal" type="number" step="1" min="0" defaultValue={form.dailyCalories ?? ""} />
          </Field>
          <Field label="Agua (ml)">
            <Input id="n_water" type="number" step="1" min="0" defaultValue={form.waterIntakeMl ?? ""} />
          </Field>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Notas</label>
            <textarea id="n_notes" defaultValue={form.notes ?? ""} className="input w-full h-24" />
          </div>

          {msg && <div className="md:col-span-2 text-sm text-green-700" aria-live="polite">{msg}</div>}
          {err && <div className="md:col-span-2 text-sm text-red-600" aria-live="polite">{err}</div>}

          <div className="md:col-span-2">
            <Button type="submit">Guardar nutrición</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
