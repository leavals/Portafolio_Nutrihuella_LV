"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui";

type Pet = {
  id: string;
  name: string;
  species: "DOG" | "CAT" | "OTHER";
  sex: "MALE" | "FEMALE";
  breed?: string | null;
  age?: number | null;
  weightKg?: number | null;
  photoUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const SPECIES: Record<Pet["species"], string> = { DOG: "Perro", CAT: "Gato", OTHER: "Otro" };
const SEX: Record<Pet["sex"], string> = { MALE: "Macho", FEMALE: "Hembra" };

export default function PetViewPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await api.get<Pet>(`/api/pets/${id}`);
        setPet(data);
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
    return pet.photoUrl.startsWith("http") ? pet.photoUrl : `${base}${pet.photoUrl}`;
  }, [pet]);

  if (!id) return <p className="text-sm text-slate-500">Ruta inválida.</p>;
  if (loading) return <p className="text-sm text-slate-500">Cargando…</p>;
  if (err) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{err}</p>
        <Link href="/dashboard" className="underline">← Volver a mascotas</Link>
      </div>
    );
  }
  if (!pet) return <p className="text-sm text-slate-500">Mascota no encontrada.</p>;

  return (
    <div className="space-y-4">
      <Link href="/dashboard" className="text-sm underline">← Volver a mascotas</Link>
      <h1 className="text-2xl font-semibold">Ficha de Mascota — {pet.name}</h1>

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
            <Info label="Edad" value={pet.age != null ? `${pet.age} años` : "—"} />
            <Info label="Peso" value={pet.weightKg != null ? `${pet.weightKg} kg` : "—"} />
          </div>
          <div className="shrink-0">
            <Link href={`/pets/${pet.id}/edit`} className="btn btn-primary">Editar</Link>
          </div>
        </div>
      </Card>

      
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
