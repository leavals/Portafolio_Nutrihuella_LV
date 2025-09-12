"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2"><PawPrint className="text-brand-teal" /> Mis Mascotas</h1>
        <a href="/pets" className="btn btn-ghost">Ver todas</a>
      </header>

      <CreatePet onCreated={load} />

      <Card>
        {loading ? <p>Cargando…</p> : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pets.map(p => (
              <div key={p.id} className="border rounded-xl p-4 hover:shadow-soft transition bg-white">
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-sm text-brand-gray">{p.species} • {p.sex} • {p.breed ?? "—"}</p>
                <p className="text-sm text-brand-gray">Peso: {p.weightKg ?? "—"} kg</p>
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
    setForm({ name: "", species: "DOG", sex: "MALE" });
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
        <Field label="Raza">
          <Input value={form.breed ?? ""} onChange={e=>setForm({...form, breed:e.target.value})}/>
        </Field>
        <Field label="Peso (kg)">
          <Input type="number" step="0.01" value={form.weightKg ?? ""} onChange={e=>setForm({...form, weightKg: e.target.value? Number(e.target.value): null})}/>
        </Field>
        <div className="flex items-end">
          <Button type="submit">Crear</Button>
        </div>
      </form>
    </Card>
  );
}
