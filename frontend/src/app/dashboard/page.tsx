"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { PawPrint } from "lucide-react";

type Pet = {
  id: string;
  name: string;
  species: "DOG" | "CAT" | "OTHER";
  breed?: string | null;
  sex: "MALE" | "FEMALE";
  weightKg?: number | null;
  photoUrl?: string | null;
};

export default function Dashboard() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await api.get<Pet[]>("/api/pets");
    setPets(data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  // Resumen simple (opcional, se muestra si lo quieres)
  const stats = useMemo(() => {
    const total = pets.length;
    const dogs = pets.filter(p => p.species === "DOG").length;
    const cats = pets.filter(p => p.species === "CAT").length;
    const others = total - dogs - cats;
    return { total, dogs, cats, others };
  }, [pets]);

  // Genera el src de la miniatura
  function imgSrc(p: Pet) {
    if (!p.photoUrl) return "/placeholder.png";
    // Si viene absoluto lo usamos tal cual; si no, apoyamos el rewrite /uploads → backend
    if (p.photoUrl.startsWith("http")) return p.photoUrl;
    const base = process.env.NEXT_PUBLIC_API_BASE || ""; // con rewrites basta dejarlo vacío
    return `${base}${p.photoUrl}`;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <PawPrint className="text-brand-teal" /> Mascotas
        </h1>
        <a href="/pets" className="btn btn-ghost">Ver todas</a>
      </header>

      {/* Tarjetas de resumen (opcional) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-sm text-slate-500">Total</div>
          <div className="text-2xl font-semibold">{stats.total}</div>
        </Card>
        <Card>
          <div className="text-sm text-slate-500">Perros</div>
          <div className="text-2xl font-semibold">{stats.dogs}</div>
        </Card>
        <Card>
          <div className="text-sm text-slate-500">Gatos</div>
          <div className="text-2xl font-semibold">{stats.cats}</div>
        </Card>
        <Card>
          <div className="text-sm text-slate-500">Otros</div>
          <div className="text-2xl font-semibold">{stats.others}</div>
        </Card>
      </div>

      <CreatePet onCreated={load} />

      <Card>
        {loading ? (
          <p>Cargando…</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pets.map(p => (
              <div
                key={p.id}
                className="border rounded-xl p-4 hover:shadow-soft transition bg-white"
              >
                <div className="flex gap-3 items-start">
                  {/* Miniatura */}
                  <img
                    src={imgSrc(p)}
                    alt={`Foto de ${p.name}`}
                    className="h-12 w-12 rounded-lg object-cover bg-slate-100 border"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-sm text-brand-gray">
                      {p.sex === "MALE" ? "Macho" : "Hembra"} • {p.breed ?? "—"} • {p.weightKg ?? "—"} kg
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <Link className="btn btn-outline" href={`/pets/${p.id}`}>Administrar</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function CreatePet({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState<any>({ name: "", species: "DOG", sex: "MALE" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/api/pets", form);
    setForm({ name: "", species: "DOG", sex: "MALE", breed: "", weightKg: "" });
    onCreated();
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold mb-2">Agregar mascota</h2>
      <form onSubmit={submit} className="grid md:grid-cols-3 gap-3">
        <Field label="Nombre">
          <Input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required/>
        </Field>
        <Field label="Especie">
          <Select value={form.species} onChange={e=>setForm({...form, species:e.target.value})}>
            <option value="DOG">Perro</option>
            <option value="CAT">Gato</option>
            <option value="OTHER">Otro</option>
          </Select>
        </Field>
        <Field label="Sexo">
          <Select value={form.sex} onChange={e=>setForm({...form, sex:e.target.value})}>
            <option value="MALE">Macho</option>
            <option value="FEMALE">Hembra</option>
          </Select>
        </Field>
        <Field label="Raza (opcional)">
          <Input value={form.breed ?? ""} onChange={e=>setForm({...form, breed:e.target.value})}/>
        </Field>
        <Field label="Peso (kg)">
          <Input
            type="number"
            step="0.01"
            value={form.weightKg ?? ""}
            onChange={e=>setForm({...form, weightKg: e.target.value ? Number(e.target.value) : null})}
          />
        </Field>
        <div className="flex items-end">
          <Button type="submit">Crear</Button>
        </div>
      </form>
    </Card>
  );
}
