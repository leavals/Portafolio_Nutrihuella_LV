"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import Image from "next/image";
import { Plus, PawPrint } from "lucide-react";
import AddPetModal from "@/components/pets/AddPetModal";

export type Pet = {
  id: string;
  name: string;
  species: "DOG" | "CAT" | "OTHER";
  breed?: string | null;
  sex: "MALE" | "FEMALE";
  weightKg?: number | null;
  photoUrl?: string | null;
};

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<Pet[]>("/api/pets");
      setPets(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const total = pets.length;
    const dogs = pets.filter(p => p.species === "DOG").length;
    const cats = pets.filter(p => p.species === "CAT").length;
    const others = total - dogs - cats;
    return { total, dogs, cats, others };
  }, [pets]);

  function imgSrc(p: Pet) {
    // placeholder que ya subiste en /public/nutrihuella/avatar-placeholder.png
    const placeholder = "/nutrihuella/avatar-placeholder.png";
    if (!p.photoUrl) return placeholder;
    if (p.photoUrl.startsWith("http")) return p.photoUrl;
    const base = process.env.NEXT_PUBLIC_API_BASE || "";
    return `${base}${p.photoUrl}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-ink flex items-center gap-3">
          <PawPrint className="h-6 w-6 text-[--nh-primary]" />
          Mis mascotas
        </h1>

        <button
          className="btn btn-primary flex items-center gap-2"
          onClick={() => setShowModal(true)}
        >
          <Plus className="h-4 w-4" />
          Agregar mascota
        </button>
      </header>

      {/* Resumen pequeño (opcional) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-muted">Total</div>
          <div className="text-2xl font-semibold text-ink">{stats.total}</div>
        </div>
        <div className="card">
          <div className="text-sm text-muted">Perros</div>
          <div className="text-2xl font-semibold text-ink">{stats.dogs}</div>
        </div>
        <div className="card">
          <div className="text-sm text-muted">Gatos</div>
          <div className="text-2xl font-semibold text-ink">{stats.cats}</div>
        </div>
        <div className="card">
          <div className="text-sm text-muted">Otros</div>
          <div className="text-2xl font-semibold text-ink">{stats.others}</div>
        </div>
      </div>

      {/* Grid de mascotas */}
      <section className="card">
        {loading ? (
          <p className="text-muted">Cargando…</p>
        ) : pets.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted">Aún no has agregado mascotas.</p>
            <button className="btn btn-primary mt-4" onClick={() => setShowModal(true)}>
              Agregar mascota
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pets.map((p) => (
              <article
                key={p.id}
                className="border border-[--nh-border] rounded-2xl p-4 bg-white shadow-sm hover:shadow transition"
              >
                <div className="flex gap-4 items-start">
                  {/* Foto */}
                  <div className="h-16 w-16 rounded-xl overflow-hidden border border-[--nh-border] bg-[#F8F8F8]">
                    {/* Image optimizada (si la URL es remota y no está en next.config, puedes volver a <img> normal) */}
                    <Image
                      src={imgSrc(p)}
                      alt={`Foto de ${p.name}`}
                      width={64}
                      height={64}
                      className="h-16 w-16 object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-ink truncate">{p.name}</h3>
                    <p className="text-sm text-muted">
                      {p.species === "DOG" ? "Perro" : p.species === "CAT" ? "Gato" : "Otro"} •{" "}
                      {p.sex === "MALE" ? "Macho" : "Hembra"}
                      {p.breed ? ` • ${p.breed}` : ""} {p.weightKg ? `• ${p.weightKg} kg` : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <a className="btn btn-outline" href={`/pets/${p.id}`}>Administrar</a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Modal agregar */}
      {showModal && (
        <AddPetModal
          onClose={() => setShowModal(false)}
          onCreated={async () => {
            await load();          // recarga la lista
            setShowModal(false);   // cierra el modal
          }}
        />
      )}
    </div>
  );
}
