"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button, Card, Field, Input, Select } from "@/components/ui";

type Pet = {
  id: string;
  name: string;
  species: "DOG" | "CAT" | "OTHER";
  sex: "MALE" | "FEMALE";
  breed?: string | null;
  weightKg?: number | null;
  photoUrl?: string | null;
};

export default function EditPetPage() {
  const params = useParams<{ id: string }>();
  const petId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const router = useRouter();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!petId) return;
    (async () => {
      setLoading(true);
      setLoadErr(null);
      try {
        const p = await api.get<Pet>(`/api/pets/${petId}`);
        setPet(p);
      } catch (e: any) {
        setLoadErr(e?.message || "No se pudo cargar la mascota");
      } finally {
        setLoading(false);
      }
    })();
  }, [petId]);

  const imgSrc = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
    if (!pet?.photoUrl) return "/placeholder.png";
    return pet.photoUrl.startsWith("http") ? pet.photoUrl : `${base}${pet.photoUrl}`;
  }, [pet]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!pet) return;
    setSaving(true);
    setSaveErr(null);
    try {
      await api.patch(`/api/pets/${pet.id}`, {
        name: pet.name,
        species: pet.species,
        sex: pet.sex,
        breed: pet.breed ?? null,
        weightKg: typeof pet.weightKg === "number" ? pet.weightKg : null,
      });
      router.push(`/pets/${pet.id}`);
    } catch (e: any) {
      setSaveErr(e?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(file: File) {
    if (!pet) return;
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch(`/api/pets/${pet.id}/photo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` },
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Error subiendo imagen");
    setPet({ ...pet, photoUrl: data.photoUrl });
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.currentTarget.files?.[0];
    if (!f) {
      setNotice("Archivo requerido");
      return;
    }
    try {
      await uploadPhoto(f);
      setNotice(`Foto de “${pet?.name ?? ""}” actualizada`);
    } catch (err: any) {
      setSaveErr(err?.message || "Error subiendo imagen");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (!petId) return <p className="text-sm text-slate-500">Ruta inválida.</p>;
  if (loading) return <p className="text-sm text-slate-500">Cargando…</p>;
  if (loadErr) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{loadErr}</p>
        <Link href="/dashboard" className="underline">← Volver a mascotas</Link>
      </div>
    );
  }
  if (!pet) return <p className="text-sm text-slate-500">Mascota no encontrada.</p>;

  return (
    <div className="space-y-4">
      <Link href={`/pets/${pet.id}`} className="text-sm underline">← Volver</Link>
      <h1 className="text-2xl font-semibold">Editar mascota</h1>

      {notice && (
        <div className="rounded-lg border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm flex items-center justify-between">
          <span>{notice}</span>
          <button className="underline" onClick={() => setNotice(null)}>Cerrar</button>
        </div>
      )}

      {saveErr && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
          {saveErr}
        </div>
      )}

      <Card>
        <form onSubmit={save} className="grid md:grid-cols-3 gap-4" noValidate>
          <div className="md:col-span-3 flex items-center gap-4">
            <img src={imgSrc} alt="" className="h-24 w-24 rounded-xl object-cover bg-slate-100 border" />
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickFile}
              />
              <Button type="button" onClick={() => fileRef.current?.click()}>Cambiar foto</Button>
            </div>
          </div>

          <Field label="Nombre">
            <Input value={pet.name} onChange={e => setPet({ ...pet, name: e.target.value })} required />
          </Field>

          <Field label="Especie">
            <Select value={pet.species} onChange={e => setPet({ ...pet, species: e.target.value as Pet["species"] })}>
              <option value="DOG">Perro</option>
              <option value="CAT">Gato</option>
              <option value="OTHER">Otro</option>
            </Select>
          </Field>

          <Field label="Sexo">
            <Select value={pet.sex} onChange={e => setPet({ ...pet, sex: e.target.value as Pet["sex"] })}>
              <option value="MALE">Macho</option>
              <option value="FEMALE">Hembra</option>
            </Select>
          </Field>

          <Field label="Raza (opcional)">
            <Input value={pet.breed ?? ""} onChange={e => setPet({ ...pet, breed: e.target.value })} />
          </Field>

          <Field label="Peso (kg)">
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              value={pet.weightKg ?? ""}
              onChange={e => setPet({ ...pet, weightKg: e.target.value ? Number(e.target.value) : null })}
            />
          </Field>

          <div className="md:col-span-3">
            <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
