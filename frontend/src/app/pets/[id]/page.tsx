// frontend/src/app/pets/[id]/page.tsx
"use client";

/**
 * Ficha de Mascota (detalle + edición)
 * ------------------------------------------------------------
 * Tabs: Resumen, Clínica, Nutrición, Vacunas, Enfermedades, Pesos
 * - Fechas robustas (evita "Invalid time value")
 * - DELETE soportado (api.delete / alias api.del)
 * - Edad / Peso enviados como number (o null si vacío)
 * - Arrays ingresados como CSV (se convierten a string[] en el body)
 */

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

// ------------------ Tipos mínimos para el front ------------------
type Pet = {
  id: string;
  name: string;
  species: string;
  sex?: string | null;
  breed?: string | null;
  age?: number | null;
  weightKg?: number | null;
};

type Clinical = {
  allergies?: string[];
  chronicConditions?: string[];
  medications?: string[];
  surgeries?: string[];
  lastVetVisit?: string | null;
  lastDeworming?: string | null;
  lastFleaTick?: string | null;
  bloodType?: string | null;
  vetClinic?: string | null;
  vetPhone?: string | null;
  notes?: string | null;
} | null;

type Vacc = { id: string; name: string; date: string };
type Dis  = { id: string; name: string; diagnosedAt: string; status: string };
type WLog = { id: string; date: string; weightKg: number };

type Nutrition = {
  dietType: string;
  mealsPerDay: number;
  activityLevel: string;
  goal: string;
  preferredFoods?: string[];
  forbiddenFoods?: string[];
  intolerances?: string[];
  foodAllergies?: string[];
  supplements?: string[];
  dailyCalories?: number | null;
  waterIntakeMl?: number | null;
  notes?: string | null;
} | null;

// ------------------ Helpers fechas / csv ------------------
// Convierte "YYYY-MM-DD" a ISO si es válido; si no, devuelve undefined (no se envía).
function toISODate(d?: string | null): string | undefined {
  if (!d) return undefined;
  const t = d.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return undefined;
  const dt = new Date(`${t}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return undefined;
  return dt.toISOString();
}
// Convierte ISO → "YYYY-MM-DD" para inputs date/text
function fromISODate(iso?: string | null): string {
  if (!iso) return "";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}
const toCSV = (arr?: string[]) => (arr && arr.length ? arr.join(", ") : "");
const fromCSV = (s?: string) =>
  s ? s.split(",").map((x) => x.trim()).filter(Boolean) : [];

// ============================================================

export default function PetDetailPage() {
  const params = useParams<{ id: string }>();
  const petId = params.id;
  const router = useRouter();

  const [tab, setTab] = useState<"summary" | "clinical" | "nutrition" | "vacc" | "dis" | "w">("summary");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Datos
  const [pet, setPet] = useState<Pet | null>(null);
  const [clinical, setClinical] = useState<Clinical>(null);
  const [nutrition, setNutrition] = useState<Nutrition>(null);
  const [vaccs, setVaccs] = useState<Vacc[]>([]);
  const [diseases, setDiseases] = useState<Dis[]>([]);
  const [weights, setWeights] = useState<WLog[]>([]);

  // Formularios (resumen y clínica / nutrición)
  const [edit, setEdit] = useState(false);
  const [pName, setPName] = useState("");
  const [pSpecies, setPSpecies] = useState("DOG");
  const [pSex, setPSex] = useState<string>("");
  const [pBreed, setPBreed] = useState<string>("");
  const [pAge, setPAge] = useState<string>("");
  const [pWeight, setPWeight] = useState<string>("");

  // Clínica
  const [fAllergies, setFAllergies] = useState("");
  const [fChronic, setFChronic] = useState("");
  const [fMeds, setFMeds] = useState("");
  const [fSurgeries, setFSurgeries] = useState("");
  const [fLastVisit, setFLastVisit] = useState("");
  const [fDeworm, setFDeworm] = useState("");
  const [fFlea, setFFlea] = useState("");
  const [fBlood, setFBlood] = useState("");
  const [fClinic, setFClinic] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fNotes, setFNotes] = useState("");

  // Nutrición
  const [nDiet, setNDiet] = useState("RAW");
  const [nMeals, setNMeals] = useState("2");
  const [nAct, setNAct] = useState("MODERATE");
  const [nGoal, setNGoal] = useState("MAINTENANCE");
  const [nPref, setNPref] = useState("");
  const [nForb, setNForb] = useState("");
  const [nInt, setNInt] = useState("");
  const [nAll, setNAll] = useState("");
  const [nSupp, setNSupp] = useState("");
  const [nKcal, setNKcal] = useState("");
  const [nWater, setNWater] = useState("");
  const [nNotes, setNNotes] = useState("");

  // Inputs de vacunas / enfermedades / pesos
  const [vName, setVName] = useState("");
  const [vDate, setVDate] = useState("");
  const [dName, setDName] = useState("");
  const [dDate, setDDate] = useState("");
  const [dStatus, setDStatus] = useState("ACTIVE");
  const [wDate, setWDate] = useState("");
  const [wKg, setWKg] = useState("");

  // ---------------- Carga ----------------
  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [p, cr, np, vs, ds, ws] = await Promise.all([
        api.get<Pet>(`/api/pets/${petId}`),
        api.get<Clinical>(`/api/pets/${petId}/clinical`),
        api.get<Nutrition>(`/api/pets/${petId}/nutrition`),
        api.get<Vacc[]>(`/api/pets/${petId}/clinical/vaccinations`),
        api.get<Dis[]>(`/api/pets/${petId}/clinical/diseases`),
        api.get<WLog[]>(`/api/pets/${petId}/clinical/weights`),
      ]);

      setPet(p);
      // Inicializa campos de edición resumen
      setPName(p.name ?? "");
      setPSpecies(p.species ?? "DOG");
      setPSex(p.sex ?? "");
      setPBreed(p.breed ?? "");
      setPAge(p.age != null ? String(p.age) : "");
      setPWeight(p.weightKg != null ? String(p.weightKg) : "");

      setClinical(cr);
      setFAllergies(toCSV(cr?.allergies));
      setFChronic(toCSV(cr?.chronicConditions));
      setFMeds(toCSV(cr?.medications));
      setFSurgeries(toCSV(cr?.surgeries));
      setFLastVisit(fromISODate(cr?.lastVetVisit ?? undefined));
      setFDeworm(fromISODate(cr?.lastDeworming ?? undefined));
      setFFlea(fromISODate(cr?.lastFleaTick ?? undefined));
      setFBlood(cr?.bloodType ?? "");
      setFClinic(cr?.vetClinic ?? "");
      setFPhone(cr?.vetPhone ?? "");
      setFNotes(cr?.notes ?? "");

      setNutrition(np);
      setNDiet(np?.dietType ?? "RAW");
      setNMeals(String(np?.mealsPerDay ?? 2));
      setNAct(np?.activityLevel ?? "MODERATE");
      setNGoal(np?.goal ?? "MAINTENANCE");
      setNPref(toCSV(np?.preferredFoods));
      setNForb(toCSV(np?.forbiddenFoods));
      setNInt(toCSV(np?.intolerances));
      setNAll(toCSV(np?.foodAllergies));
      setNSupp(toCSV(np?.supplements));
      setNKcal(np?.dailyCalories != null ? String(np.dailyCalories) : "");
      setNWater(np?.waterIntakeMl != null ? String(np.waterIntakeMl) : "");
      setNNotes(np?.notes ?? "");

      setVaccs(vs);
      setDiseases(ds);
      setWeights(ws);
    } catch (e: any) {
      setErr(e.message ?? "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId]);

  // ---------------- Guardar resumen ----------------
  async function saveSummary() {
    if (!pet) return;
    setErr(null);
    try {
      const body: any = {
        name: pName.trim(),
        species: pSpecies,
        sex: pSex || null,
        breed: pBreed || null,
      };
      if (pAge.trim() !== "") {
        const n = Number(pAge);
        if (!Number.isNaN(n)) body.age = n; else body.age = null;
      } else body.age = null;

      if (pWeight.trim() !== "") {
        const w = Number(pWeight);
        if (!Number.isNaN(w)) body.weightKg = w; else body.weightKg = null;
      } else body.weightKg = null;

      const updated = await api.patch<Pet>(`/api/pets/${petId}`, body);
      setPet(updated);
      setEdit(false);
    } catch (e: any) {
      setErr(e.message ?? "No se pudo guardar");
    }
  }

  // ---------------- Guardar clínica ----------------
  async function saveClinical() {
    setErr(null);
    try {
      const body = {
        allergies: fromCSV(fAllergies),
        chronicConditions: fromCSV(fChronic),
        medications: fromCSV(fMeds),
        surgeries: fromCSV(fSurgeries),
        lastVetVisit: toISODate(fLastVisit),
        lastDeworming: toISODate(fDeworm),
        lastFleaTick: toISODate(fFlea),
        bloodType: fBlood || null,
        vetClinic: fClinic || null,
        vetPhone: fPhone || null,
        notes: fNotes || null,
      };
      const cr = await api.put<Clinical>(`/api/pets/${petId}/clinical`, body);
      setClinical(cr);
    } catch (e: any) {
      setErr(e.message ?? "No se pudo guardar clínica");
    }
  }

  // ---------------- Guardar nutrición ----------------
  async function saveNutrition() {
    setErr(null);
    try {
      const body = {
        dietType: nDiet,
        mealsPerDay: Number(nMeals || 2),
        activityLevel: nAct,
        goal: nGoal,
        preferredFoods: fromCSV(nPref),
        forbiddenFoods: fromCSV(nForb),
        intolerances: fromCSV(nInt),
        foodAllergies: fromCSV(nAll),
        supplements: fromCSV(nSupp),
        dailyCalories: nKcal ? Number(nKcal) : null,
        waterIntakeMl: nWater ? Number(nWater) : null,
        notes: nNotes || null,
      };
      const np = await api.put<Nutrition>(`/api/pets/${petId}/nutrition`, body);
      setNutrition(np);
    } catch (e: any) {
      setErr(e.message ?? "No se pudo guardar nutrición");
    }
  }

  // ---------------- Vacunas ----------------
  async function addVacc() {
    setErr(null);
    try {
      if (!vName.trim()) throw new Error("Falta nombre de vacuna");
      await api.post(`/api/pets/${petId}/clinical/vaccinations`, {
        name: vName.trim(),
        date: toISODate(vDate) ?? undefined,
      });
      setVName("");
      setVDate("");
      await load();
    } catch (e: any) {
      setErr(e.message ?? "No se pudo agregar vacuna");
    }
  }
  async function delVacc(id: string) {
    await api.delete(`/api/pets/${petId}/clinical/vaccinations/${id}`);
    await load();
  }

  // ---------------- Enfermedades ----------------
  async function addDisease() {
    setErr(null);
    try {
      if (!dName.trim()) throw new Error("Falta nombre de enfermedad");
      await api.post(`/api/pets/${petId}/clinical/diseases`, {
        name: dName.trim(),
        diagnosedAt: toISODate(dDate) ?? undefined,
        status: dStatus,
      });
      setDName(""); setDDate("");
      await load();
    } catch (e: any) {
      setErr(e.message ?? "No se pudo agregar enfermedad");
    }
  }
  async function updDisease(id: string, status: string) {
    await api.patch(`/api/pets/${petId}/clinical/diseases/${id}`, { status });
    await load();
  }
  async function delDisease(id: string) {
    await api.delete(`/api/pets/${petId}/clinical/diseases/${id}`);
    await load();
  }

  // ---------------- Pesos ----------------
  async function addWeight() {
    setErr(null);
    try {
      const w = Number(wKg);
      if (!w || Number.isNaN(w)) throw new Error("Peso inválido");
      await api.post(`/api/pets/${petId}/clinical/weights`, {
        weightKg: w,
        date: toISODate(wDate) ?? undefined,
      });
      setWKg(""); setWDate("");
      await load();
    } catch (e: any) {
      setErr(e.message ?? "No se pudo agregar peso");
    }
  }
  async function delWeight(id: string) {
    await api.delete(`/api/pets/${petId}/clinical/weights/${id}`);
    await load();
  }

  const title = useMemo(() => {
    if (!pet) return "Ficha de Mascota";
    return `Ficha de Mascota — ${pet.name}`;
  }, [pet]);

  // ---------------- Render ----------------
  if (loading) return <div className="p-6">Cargando...</div>;
  if (err) return <div className="p-6 text-red-700">Error: {err}</div>;
  if (!pet) return <div className="p-6">Mascota no encontrada</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">{title}</h1>

      <p className="text-sm">
        ID: <code>{pet.id}</code>
      </p>

      <p>
        <Link href="/pets">← Volver</Link>
      </p>

      <div className="space-x-2">
        <button onClick={() => setTab("summary")}>Resumen</button>
        <button onClick={() => setTab("clinical")}>Clínica</button>
        <button onClick={() => setTab("nutrition")}>Nutrición</button>
        <button onClick={() => setTab("vacc")}>Vacunas</button>
        <button onClick={() => setTab("dis")}>Enfermedades</button>
        <button onClick={() => setTab("w")}>Pesos</button>
      </div>

      {/* ---------------- Resumen ---------------- */}
      {tab === "summary" && (
        <div className="space-y-2">
          {!edit ? (
            <>
              <h2 className="text-xl font-semibold">Resumen</h2>
              <p><b>Nombre:</b> {pet.name}</p>
              <p><b>Especie:</b> {pet.species}</p>
              <p><b>Sexo:</b> {pet.sex || "-"}</p>
              <p><b>Raza:</b> {pet.breed || "-"}</p>
              <p><b>Edad:</b> {pet.age != null ? `${pet.age} años` : "-"}</p>
              <p><b>Peso:</b> {pet.weightKg != null ? `${pet.weightKg} kg` : "-"}</p>
              <button onClick={() => setEdit(true)}>Editar</button>
            </>
          ) : (
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Editar Mascota</h2>
              <div><label>Nombre: <input value={pName} onChange={(e)=>setPName(e.target.value)} /></label></div>
              <div><label>Especie: <input value={pSpecies} onChange={(e)=>setPSpecies(e.target.value)} placeholder="DOG/CAT/OTHER" /></label></div>
              <div><label>Sexo: <input value={pSex} onChange={(e)=>setPSex(e.target.value)} placeholder="MALE/FEMALE" /></label></div>
              <div><label>Raza: <input value={pBreed} onChange={(e)=>setPBreed(e.target.value)} /></label></div>
              <div><label>Edad (años): <input type="number" value={pAge} onChange={(e)=>setPAge(e.target.value)} /></label></div>
              <div><label>Peso (kg): <input type="number" step="0.01" value={pWeight} onChange={(e)=>setPWeight(e.target.value)} /></label></div>
              <div className="space-x-2">
                <button onClick={saveSummary}>Guardar</button>
                <button onClick={()=>{ setEdit(false); load(); }}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- Clínica ---------------- */}
      {tab === "clinical" && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Ficha clínica</h2>
          <div><label>Alergias (CSV): <input value={fAllergies} onChange={(e)=>setFAllergies(e.target.value)} /></label></div>
          <div><label>Condiciones crónicas (CSV): <input value={fChronic} onChange={(e)=>setFChronic(e.target.value)} /></label></div>
          <div><label>Medicamentos (CSV): <input value={fMeds} onChange={(e)=>setFMeds(e.target.value)} /></label></div>
          <div><label>Cirugías (CSV): <input value={fSurgeries} onChange={(e)=>setFSurgeries(e.target.value)} /></label></div>
          <div><label>Última visita vet (YYYY-MM-DD): <input value={fLastVisit} onChange={(e)=>setFLastVisit(e.target.value)} /></label></div>
          <div><label>Última desparasitación: <input value={fDeworm} onChange={(e)=>setFDeworm(e.target.value)} /></label></div>
          <div><label>Último antipulgas: <input value={fFlea} onChange={(e)=>setFFlea(e.target.value)} /></label></div>
          <div><label>Tipo de sangre: <input value={fBlood} onChange={(e)=>setFBlood(e.target.value)} /></label></div>
          <div><label>Clínica: <input value={fClinic} onChange={(e)=>setFClinic(e.target.value)} /></label></div>
          <div><label>Fono vet: <input value={fPhone} onChange={(e)=>setFPhone(e.target.value)} /></label></div>
          <div><label>Notas: <textarea value={fNotes} onChange={(e)=>setFNotes(e.target.value)} /></label></div>
          <button onClick={saveClinical}>Guardar clínica</button>
        </div>
      )}

      {/* ---------------- Nutrición ---------------- */}
      {tab === "nutrition" && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Ficha nutricional</h2>
          <div><label>Tipo dieta: <input value={nDiet} onChange={(e)=>setNDiet(e.target.value)} /></label></div>
          <div><label>Comidas/día: <input type="number" value={nMeals} onChange={(e)=>setNMeals(e.target.value)} /></label></div>
          <div><label>Actividad: <input value={nAct} onChange={(e)=>setNAct(e.target.value)} /></label></div>
          <div><label>Meta: <input value={nGoal} onChange={(e)=>setNGoal(e.target.value)} /></label></div>
          <div><label>Preferidos (CSV): <input value={nPref} onChange={(e)=>setNPref(e.target.value)} /></label></div>
          <div><label>Prohibidos (CSV): <input value={nForb} onChange={(e)=>setNForb(e.target.value)} /></label></div>
          <div><label>Intolerancias (CSV): <input value={nInt} onChange={(e)=>setNInt(e.target.value)} /></label></div>
          <div><label>Alergias alimentos (CSV): <input value={nAll} onChange={(e)=>setNAll(e.target.value)} /></label></div>
          <div><label>Suplementos (CSV): <input value={nSupp} onChange={(e)=>setNSupp(e.target.value)} /></label></div>
          <div><label>Calorías diarias: <input type="number" value={nKcal} onChange={(e)=>setNKcal(e.target.value)} /></label></div>
          <div><label>Agua (ml): <input type="number" value={nWater} onChange={(e)=>setNWater(e.target.value)} /></label></div>
          <div><label>Notas: <textarea value={nNotes} onChange={(e)=>setNNotes(e.target.value)} /></label></div>
          <button onClick={saveNutrition}>Guardar nutrición</button>
        </div>
      )}

      {/* ---------------- Vacunas ---------------- */}
      {tab === "vacc" && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Vacunas</h2>
          <div className="space-x-2">
            <input placeholder="Nombre" value={vName} onChange={(e)=>setVName(e.target.value)} />
            <input placeholder="YYYY-MM-DD" value={vDate} onChange={(e)=>setVDate(e.target.value)} />
            <button onClick={addVacc}>Agregar</button>
          </div>
          <ul className="list-disc pl-5">
            {vaccs.map(v => (
              <li key={v.id}>
                {v.name} — {fromISODate(v.date)}
                <button className="ml-3" onClick={() => delVacc(v.id)}>Eliminar</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---------------- Enfermedades ---------------- */}
      {tab === "dis" && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Enfermedades</h2>
          <div className="space-x-2">
            <input placeholder="Nombre" value={dName} onChange={(e)=>setDName(e.target.value)} />
            <input placeholder="YYYY-MM-DD" value={dDate} onChange={(e)=>setDDate(e.target.value)} />
            <select value={dStatus} onChange={(e)=>setDStatus(e.target.value)}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="CHRONIC">CHRONIC</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
            <button onClick={addDisease}>Agregar</button>
          </div>
          <ul className="list-disc pl-5">
            {diseases.map(d => (
              <li key={d.id}>
                {d.name} — {fromISODate(d.diagnosedAt)} — <b>{d.status}</b>
                <span className="ml-2">
                  <button onClick={() => updDisease(d.id, "ACTIVE")}>ACTIVE</button>{" "}
                  <button onClick={() => updDisease(d.id, "CHRONIC")}>CHRONIC</button>{" "}
                  <button onClick={() => updDisease(d.id, "RESOLVED")}>RESOLVED</button>{" "}
                  <button onClick={() => delDisease(d.id)}>Eliminar</button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---------------- Pesos ---------------- */}
      {tab === "w" && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Pesos</h2>
          <div className="space-x-2">
            <input placeholder="YYYY-MM-DD" value={wDate} onChange={(e)=>setWDate(e.target.value)} />
            <input type="number" step="0.01" placeholder="kg" value={wKg} onChange={(e)=>setWKg(e.target.value)} />
            <button onClick={addWeight}>Agregar</button>
          </div>
          <ul className="list-disc pl-5">
            {weights.map(w => (
              <li key={w.id}>
                {fromISODate(w.date)} — {w.weightKg} kg
                <button className="ml-3" onClick={() => delWeight(w.id)}>Eliminar</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-sm text-gray-500 mt-6">© 2025 NutriHuella — Proyecto académico.</p>
    </div>
  );
}
