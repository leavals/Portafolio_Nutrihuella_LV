"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, Button } from "@/components/ui";
import { PetSize, SIZE_LABELS } from "@/constans/pets";

// ----------------------
// Tipos de datos
// ----------------------
type Pet = {
  id: string;
  name: string;
  species: "DOG" | "CAT" | "OTHER";
  sex: "MALE" | "FEMALE";
  breed?: string | null;
  birthDate?: string | null;
  size?: PetSize | null;
  weightKg?: number | null;
  photoUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  sterilized?: boolean | null;
};

type Nutrition = {
  id: string;
  petId: string;
  dietType?: string | null;
  mealsPerDay?: number | null;
  activityLevel?: string | null;
  goal?: string | null;
  foodAllergies?: string[];
  intolerances?: string[];
  forbiddenFoods?: string[];
  preferredFoods?: string[];
  supplements?: string[];
  dailyCalories?: number | null;
  waterIntakeMl?: number | null;
  notes?: string | null;
  updatedAt?: string;
};

type Medical = {
  id: string;
  petId: string;
  diseases?: string | null;
  medications?: string | null;
  allergies?: string | null;
  notes?: string | null;
  updatedAt?: string;
};

type Disease = {
  id: string;
  name: string;
  description?: string | null;
  diagnosedAt: string; // Fecha de diagnóstico
  status: "ACTIVE" | "INACTIVE"; // Estado de la enfermedad
  createdAt?: string;
  updatedAt?: string;
};

// ----------------------
// Constantes
// ----------------------
const SPECIES: Record<Pet["species"], string> = {
  DOG: "Perro",
  CAT: "Gato",
  OTHER: "Otro",
};
const SEX: Record<Pet["sex"], string> = {
  MALE: "Macho",
  FEMALE: "Hembra",
};

const DIET_TYPE_LABELS: Record<string, string> = {
  MIXED: "Mixta",
  VEGETARIAN: "Vegetariana",
  RAW: "Cruda",
  DRY: "Seca",
  WET: "Húmeda",
};

const ACTIVITY_LEVEL_LABELS: Record<string, string> = {
  LOW: "Baja",
  MODERATE: "Moderada",
  HIGH: "Alta",
};

const GOAL_LABELS: Record<string, string> = {
  MAINTENANCE: "Mantenimiento",
  WEIGHT_LOSS: "Pérdida de peso",
  WEIGHT_GAIN: "Aumento de peso",
};

// ----------------------
// Componente principal
// ----------------------
export default function PetViewPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [pet, setPet] = useState<Pet | null>(null);
  const [nutrition, setNutrition] = useState<Nutrition | null>(null);
  const [medical, setMedical] = useState<Medical | null>(null);
  const [diseases, setDiseases] = useState<Disease[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // ----------------------
  // Cargar datos
  // ----------------------
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const [petData, nutritionData, diseasesData] = await Promise.all([
          api.get<Pet>(`/api/pets/${id}`),
          api.get<Nutrition | null>(`/api/pets/${id}/nutrition`),
          api.get<Disease[]>(`/api/pets/${id}/clinical/diseases`),
        ]);
        setPet(petData);
        setNutrition(nutritionData);
        setDiseases(diseasesData);
      } catch (e: any) {
        setErr(e?.message || "No se pudo cargar la mascota");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const imgSrc = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE ?? "";
    if (!pet?.photoUrl) return "/placeholder.png";
    return pet.photoUrl.startsWith("http")
      ? pet.photoUrl
      : `${base}${pet.photoUrl}`;
  }, [pet]);

  // ----------------------
  // Renderizado condicional
  // ----------------------
  if (!id) return <p className="text-sm text-slate-500">Ruta inválida.</p>;
  if (loading) return <p className="text-sm text-slate-500">Cargando…</p>;
  if (err) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{err}</p>
        <Link href="/pets" className="underline">
          ← Volver a mascotas
        </Link>
      </div>
    );
  }
  if (!pet) return <p className="text-sm text-slate-500">Mascota no encontrada.</p>;

  // ----------------------
  // UI principal
  // ----------------------
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Link href="/pets">
          <Button variant="primary" className="text-white">
            ← Volver a mascotas
          </Button>
        </Link>
      </div>
      <Card>
      <h1 className="text-2xl font-semibold">Ficha de Mascota — {pet.name}</h1>
      </Card>
      {/* ------------------ */}
      {/* Card: Datos básicos */}
      {/* ------------------ */}
      <Card>
        <div className="flex gap-6 items-start">
          <img
            src={imgSrc}
            alt={`Foto de ${pet.name}`}
            className="h-28 w-28 rounded-xl object-cover bg-slate-100 border"
          />
          <div className="flex-1 grid sm:grid-cols-2 gap-3">
            <Info label="Nombre" value={pet.name} />
            <Info label="Especie" value={SPECIES[pet.species]} />
            <Info label="Sexo" value={SEX[pet.sex]} />
            <Info label="Raza" value={pet.breed ?? "—"} />
            <Info label="Fecha de nacimiento" value={pet.birthDate ?? "—"} />
            <Info label="Tamaño" value={pet.size ? SIZE_LABELS[pet.size] : "—"} />
            <Info
              label="Peso"
              value={pet.weightKg != null ? `${pet.weightKg} kg` : "—"}
            />
            <Info label="Esterilizado" value={pet.sterilized ? "Sí" : "No"} />
          </div>
        </div>
      </Card>

      {/* ------------------ */}
      {/* Card: Nutrición */}
      {/* ------------------ */}
      <Card>
        <h2 className="text-lg font-semibold mb-2">Ficha Nutricional</h2>
        {nutrition ? (
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Info
                label="Tipo de dieta"
                value={nutrition.dietType ? DIET_TYPE_LABELS[nutrition.dietType] ?? nutrition.dietType : "—"}
              />
              <Info
                label="Comidas por día"
                value={nutrition.mealsPerDay ? `${nutrition.mealsPerDay} veces/día` : "—"}
              />
              <Info
                label="Nivel de actividad"
                value={nutrition.activityLevel ? ACTIVITY_LEVEL_LABELS[nutrition.activityLevel] ?? nutrition.activityLevel : "—"}
              />
              <Info
                label="Objetivo"
                value={nutrition.goal ? GOAL_LABELS[nutrition.goal] ?? nutrition.goal : "—"}
              />
              <Info
                label="Calorías diarias"
                value={nutrition.dailyCalories ? `${nutrition.dailyCalories} kcal` : "—"}
              />
              <Info
                label="Consumo de agua"
                value={nutrition.waterIntakeMl ? `${nutrition.waterIntakeMl} ml` : "—"}
              />
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-md font-semibold">Alergias alimentarias</h3>
                {nutrition.foodAllergies && nutrition.foodAllergies.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {nutrition.foodAllergies.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No hay alergias alimentarias registradas.</p>
                )}
              </div>
              <div>
                <h3 className="text-md font-semibold">Intolerancias</h3>
                {nutrition.intolerances && nutrition.intolerances.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {nutrition.intolerances.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No hay intolerancias registradas.</p>
                )}
              </div>
              <div>
                <h3 className="text-md font-semibold">Alimentos prohibidos</h3>
                {nutrition.forbiddenFoods && nutrition.forbiddenFoods.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {nutrition.forbiddenFoods.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No hay alimentos prohibidos registrados.</p>
                )}
              </div>
              <div>
                <h3 className="text-md font-semibold">Alimentos preferidos</h3>
                {nutrition.preferredFoods && nutrition.preferredFoods.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {nutrition.preferredFoods.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No hay alimentos preferidos registrados.</p>
                )}
              </div>
              <div>
                <h3 className="text-md font-semibold">Suplementos</h3>
                {nutrition.supplements && nutrition.supplements.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {nutrition.supplements.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No hay suplementos registrados.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Sin datos nutricionales registrados.</p>
        )}
      </Card>

      {/* ------------------ */}
      {/* Card: Enfermedades */}
      {/* ------------------ */}
      <Card>
        <h2 className="text-lg font-semibold mb-2">Ficha Enfermedades</h2>
        {diseases && diseases.length > 0 ? (
          <table className="table-auto w-full border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-4 py-2 text-left">Nombre</th>
                <th className="border border-slate-300 px-4 py-2 text-left">Fecha de Diagnóstico</th>
                <th className="border border-slate-300 px-4 py-2 text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {diseases.map((disease) => (
                <tr key={disease.id}>
                  <td className="border border-slate-300 px-4 py-2">{disease.name}</td>
                  <td className="border border-slate-300 px-4 py-2">
                    {new Date(disease.diagnosedAt).toLocaleDateString("es-ES")}
                  </td>
                  <td className="border border-slate-300 px-4 py-2">
                    {disease.status === "ACTIVE" ? "Activo" : "Inactivo"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-slate-500">Sin enfermedades registradas.</p>
        )}
      </Card>
    </div>
  );
}

// ----------------------
// Subcomponente Info
// ----------------------
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="font-medium break-words">{value}</div>
    </div>
  );
}

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
