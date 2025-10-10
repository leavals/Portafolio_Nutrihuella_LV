"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
const toArr = (s: string) =>
  (s || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

const FALLBACKS = {
  diet: {
    RAW: "Cruda",
    COOKED: "Cocinada",
    COMMERCIAL: "Comercial",
    MIXED: "Mixta",
  } as Record<string, string>,
  activity: {
    LOW: "Baja",
    MODERATE: "Moderada",
    HIGH: "Alta",
  } as Record<string, string>,
  goal: {
    MAINTENANCE: "Mantención",
    GAIN: "Subir peso",
    LOSS: "Bajar peso",
  } as Record<string, string>,
};

export default function NutritionPage() {
  const params = useParams<{ id: string }>();
  const petId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const search = useSearchParams();
  const isWizard = search?.get("wizard") === "1";

  const [form, setForm] = useState<Nutrition | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Estado de visualización/edición
  const [hasExisting, setHasExisting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Campos controlados
  const [dietType, setDietType] = useState<string>("MIXED");
  const [mealsPerDay, setMealsPerDay] = useState<number>(2);
  const [activityLevel, setActivityLevel] = useState<string>("MODERATE");
  const [goal, setGoal] = useState<string>("MAINTENANCE");
  const [preferredFoods, setPreferredFoods] = useState<string>("");
  const [forbiddenFoods, setForbiddenFoods] = useState<string>("");
  const [intolerances, setIntolerances] = useState<string>("");
  const [foodAllergies, setFoodAllergies] = useState<string>("");
  const [supplements, setSupplements] = useState<string>("");
  const [dailyCalories, setDailyCalories] = useState<string>("");
  const [waterIntakeMl, setWaterIntakeMl] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const defaults: Nutrition = useMemo(
    () => ({
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
    }),
    []
  );

  function hydrateControlled(n: Nutrition | null) {
    const base = { ...defaults, ...(n || {}) };
    setDietType(base.dietType || "MIXED");
    setMealsPerDay(base.mealsPerDay ?? 2);
    setActivityLevel(base.activityLevel || "MODERATE");
    setGoal(base.goal || "MAINTENANCE");
    setPreferredFoods(toCSV(base.preferredFoods));
    setForbiddenFoods(toCSV(base.forbiddenFoods));
    setIntolerances(toCSV(base.intolerances));
    setFoodAllergies(toCSV(base.foodAllergies));
    setSupplements(toCSV(base.supplements));
    setDailyCalories(
      typeof base.dailyCalories === "number" ? String(base.dailyCalories) : ""
    );
    setWaterIntakeMl(
      typeof base.waterIntakeMl === "number" ? String(base.waterIntakeMl) : ""
    );
    setNotes(base.notes || "");
  }

  async function fetchNutrition() {
    if (!petId) return;
    setLoading(true);
    setMsg(null);
    setErr(null);
    try {
      const data = await api.get<Nutrition | null>(`/api/pets/${petId}/nutrition`);
      const exists = !!data;
      setHasExisting(exists);
      const merged = { ...defaults, ...(data || {}) };
      setForm(merged);
      hydrateControlled(merged);

      // Si ya existe la ficha => vista; si no => edición (primera vez).
      setIsEditing(!exists);
    } catch (e: any) {
      setErr(e?.message || "No se pudo cargar la ficha nutricional");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNutrition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!petId) return;
    setMsg(null);
    setErr(null);

    try {
      await api.put(`/api/pets/${petId}/nutrition`, {
        dietType: dietType || undefined,
        mealsPerDay: mealsPerDay || undefined,
        activityLevel: activityLevel || undefined,
        goal: goal || undefined,
        preferredFoods: toArr(preferredFoods) || undefined,
        forbiddenFoods: toArr(forbiddenFoods) || undefined,
        intolerances: toArr(intolerances) || undefined,
        foodAllergies: toArr(foodAllergies) || undefined,
        supplements: toArr(supplements) || undefined,
        dailyCalories: dailyCalories ? Number(dailyCalories) : undefined,
        waterIntakeMl: waterIntakeMl ? Number(waterIntakeMl) : undefined,
        notes: notes || undefined,
      });

      setMsg("Ficha nutricional guardada correctamente.");

      // Primera vez + wizard => continuar flujo
      if (!hasExisting && isWizard) {
        router.push(`/pets/${petId}/diseases?wizard=1`);
        return;
      }

      // Si ya existía, refrescar y volver a vista
      await fetchNutrition();
      setIsEditing(false);
    } catch (e: any) {
      setErr(e?.message || "No se pudo guardar");
    }
  }

  if (!petId) return <p className="text-sm text-slate-500">Ruta inválida.</p>;
  if (loading || !form) return <p className="text-sm text-slate-500">Cargando…</p>;

  const displayOrDash = (v?: string | number | null) =>
    v === null || v === undefined || v === "" ? "—" : String(v);

  const SummaryCard = () => (
    <Card>
      <div className="p-4 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Tipo de dieta */}
          <div className="space-y-1">
            <div className="text-xs text-slate-500">Tipo de dieta</div>
            <div className="font-medium">
              {FALLBACKS.diet[dietType] ?? displayOrDash(dietType)}
            </div>
          </div>

          {/* Comidas/día + Botón editar a la derecha */}
          <div className="space-y-1">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>Comidas/día</span>
              <Button
                onClick={() => setIsEditing(true)}
                className="!py-1 !px-3 text-sm"
              >
                Editar
              </Button>
            </div>
            <div className="font-medium">{displayOrDash(mealsPerDay)}</div>
          </div>

          {/* Actividad */}
          <div className="space-y-1">
            <div className="text-xs text-slate-500">Actividad</div>
            <div className="font-medium">
              {FALLBACKS.activity[activityLevel] ?? displayOrDash(activityLevel)}
            </div>
          </div>

          {/* Meta */}
          <div className="space-y-1">
            <div className="text-xs text-slate-500">Meta</div>
            <div className="font-medium">
              {FALLBACKS.goal[goal] ?? displayOrDash(goal)}
            </div>
          </div>

          {/* Preferidos */}
          <div className="space-y-1 md:col-span-2">
            <div className="text-xs text-slate-500">Preferidos</div>
            <div className="font-medium">{preferredFoods ? preferredFoods : "—"}</div>
          </div>

          {/* Prohibidos */}
          <div className="space-y-1 md:col-span-2">
            <div className="text-xs text-slate-500">Prohibidos</div>
            <div className="font-medium">{forbiddenFoods ? forbiddenFoods : "—"}</div>
          </div>

          {/* Intolerancias */}
          <div className="space-y-1 md:col-span-2">
            <div className="text-xs text-slate-500">Intolerancias</div>
            <div className="font-medium">{intolerances ? intolerances : "—"}</div>
          </div>

          {/* Alergias alimentarias */}
          <div className="space-y-1 md:col-span-2">
            <div className="text-xs text-slate-500">Alergias alimentarias</div>
            <div className="font-medium">{foodAllergies ? foodAllergies : "—"}</div>
          </div>

          {/* Suplementos */}
          <div className="space-y-1 md:col-span-2">
            <div className="text-xs text-slate-500">Suplementos</div>
            <div className="font-medium">{supplements ? supplements : "—"}</div>
          </div>

          {/* Calorías diarias */}
          <div className="space-y-1">
            <div className="text-xs text-slate-500">Calorías diarias</div>
            <div className="font-medium">
              {dailyCalories ? `${dailyCalories} kcal` : "—"}
            </div>
          </div>

          {/* Agua (ml) */}
          <div className="space-y-1">
            <div className="text-xs text-slate-500">Agua (ml)</div>
            <div className="font-medium">
              {waterIntakeMl ? `${waterIntakeMl} ml` : "—"}
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1 md:col-span-2">
            <div className="text-xs text-slate-500">Notas</div>
            <div className="font-medium whitespace-pre-wrap">
              {notes ? notes : "—"}
            </div>
          </div>
        </div>

        {msg && (
          <div className="text-sm text-green-700" aria-live="polite">
            {msg}
          </div>
        )}
        {err && (
          <div className="text-sm text-red-600" aria-live="polite">
            {err}
          </div>
        )}
      </div>
    </Card>
  );

  const EditForm = () => (
    <Card>
      <form onSubmit={save} className="grid md:grid-cols-2 gap-4 p-4" noValidate>
        {/* Tipo de dieta */}
        <div className="flex items-center gap-4">
          <label htmlFor="n_diet" className="w-36 text-sm font-medium">
            Tipo de dieta
          </label>
          <Select
            id="n_diet"
            value={dietType}
            onChange={(e) => setDietType(e.target.value)}
            className="flex-1"
          >
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
            value={mealsPerDay}
            onChange={(e) => setMealsPerDay(Number(e.target.value))}
            className="w-28"
          />
        </div>

        {/* Actividad */}
        <div className="flex items-center gap-4">
          <label htmlFor="n_activity" className="w-36 text-sm font-medium">
            Actividad
          </label>
          <Select
            id="n_activity"
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value)}
            className="flex-1"
          >
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
          <Select
            id="n_goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="flex-1"
          >
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
          <Input
            id="n_pref"
            value={preferredFoods}
            onChange={(e) => setPreferredFoods(e.target.value)}
            placeholder="pollo, zanahoria"
            className="flex-1"
          />
        </div>

        {/* Prohibidos (CSV) */}
        <div className="flex items-center gap-4">
          <label htmlFor="n_forb" className="w-36 text-sm font-medium">
            Prohibidos (CSV)
          </label>
          <Input
            id="n_forb"
            value={forbiddenFoods}
            onChange={(e) => setForbiddenFoods(e.target.value)}
            placeholder="chocolate, uva"
            className="flex-1"
          />
        </div>

        {/* Intolerancias (CSV) */}
        <div className="flex items-center gap-4">
          <label htmlFor="n_intol" className="w-36 text-sm font-medium">
            Intolerancias (CSV)
          </label>
          <Input
            id="n_intol"
            value={intolerances}
            onChange={(e) => setIntolerances(e.target.value)}
            placeholder="lactosa"
            className="flex-1"
          />
        </div>

        {/* Alergias alimentarias (CSV) */}
        <div className="flex items-center gap-4">
          <label htmlFor="n_allerg" className="w-36 text-sm font-medium">
            Alergias alimentarias (CSV)
          </label>
          <Input
            id="n_allerg"
            value={foodAllergies}
            onChange={(e) => setFoodAllergies(e.target.value)}
            placeholder="gluten"
            className="flex-1"
          />
        </div>

        {/* Suplementos (CSV) */}
        <div className="flex items-center gap-4">
          <label htmlFor="n_suppl" className="w-36 text-sm font-medium">
            Suplementos (CSV)
          </label>
          <Input
            id="n_suppl"
            value={supplements}
            onChange={(e) => setSupplements(e.target.value)}
            placeholder="omega 3"
            className="flex-1"
          />
        </div>

        {/* Calorías diarias */}
        <div className="flex items-center gap-4">
          <label htmlFor="n_cal" className="w-36 text-sm font-medium">
            Calorías diarias
          </label>
          <Input
            id="n_cal"
            type="number"
            step={1}
            min={0}
            value={dailyCalories}
            onChange={(e) => setDailyCalories(e.target.value)}
            className="w-36"
          />
        </div>

        {/* Agua (ml) */}
        <div className="flex items-center gap-4">
          <label htmlFor="n_water" className="w-36 text-sm font-medium">
            Agua (ml)
          </label>
          <Input
            id="n_water"
            type="number"
            step={1}
            min={0}
            value={waterIntakeMl}
            onChange={(e) => setWaterIntakeMl(e.target.value)}
            className="w-36"
          />
        </div>

        {/* Notas */}
        <div className="md:col-span-2">
          <label htmlFor="n_notes" className="block text-sm font-medium mb-1">
            Notas
          </label>
          <textarea
            id="n_notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input w-full h-24"
          />
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

        <div className="md:col-span-2 flex items-center gap-2">
          <Button type="submit">Guardar</Button>
          {hasExisting && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Descartar cambios y volver a vista
                hydrateControlled(form!);
                setIsEditing(false);
                setMsg(null);
                setErr(null);
              }}
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </Card>
  );

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
          {isWizard && !hasExisting && (
            <p className="text-sm text-slate-600 mt-1">
              Paso 1 de 2 • Completa la ficha y guarda para continuar.
            </p>
          )}
        </div>
      </Card>

      {/* Vista o Edición */}
      {isEditing ? <EditForm /> : <SummaryCard />}
    </div>
  );
}
