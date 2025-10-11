"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import Image from "next/image";
import { Plus, PawPrint, Trash2 } from "lucide-react";
import AddPetModal from "@/components/pets/AddPetModal";
import { SIZE_LABELS } from "@/constans/pets";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";

export type Pet = {
  id: string;
  name: string;
  species: "DOG" | "CAT" | "OTHER";
  breed?: string | null;
  sex: "MALE" | "FEMALE";
  size?: import("@/constans/pets").PetSize | null;
  weightKg?: number | null;
  photoUrl?: string | null;
  sterilized?: boolean | null;

  // campos de completitud
  nutrition?: boolean;
  diseasesCount?: number;
  noDiseasesAck?: boolean;
  complete?: boolean;
};

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Pet[]>("/api/pets");
      if (!Array.isArray(data)) {
        setPets([]);
        return;
      }

      const completions = await Promise.allSettled(
        data.map((p) =>
          api.get(`/api/pets/${p.id}/wizard/completion`).catch(() => null)
        )
      );

      const merged: Pet[] = data.map((p, i) => {
        const settled = completions[i];
        let completion: any = null;
        if (settled && (settled as PromiseFulfilledResult<any>).status === "fulfilled") {
          completion = (settled as PromiseFulfilledResult<any>).value;
        }
        const nutrition = completion?.nutrition ?? false;
        const diseasesCount = Number(completion?.diseasesCount ?? 0);
        const noDiseasesAck = completion?.noDiseasesAck ?? false;
        const complete = completion?.complete ?? (nutrition && (diseasesCount > 0 || noDiseasesAck));

        return { ...p, nutrition, diseasesCount, noDiseasesAck, complete };
      });

      setPets(merged);
    } catch (e: any) {
      console.error("load pets error:", e);
      setError(e?.message || "No se pudo cargar las mascotas");
      setPets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const total = pets.length;
    const dogs = pets.filter((p) => p.species === "DOG").length;
    const cats = pets.filter((p) => p.species === "CAT").length;
    const others = total - dogs - cats;
    const completeCount = pets.filter((p) => p.complete).length;
    return { total, dogs, cats, others, completeCount };
  }, [pets]);

  function imgSrc(p: Pet) {
    const placeholder = "/nutrihuella/avatar-placeholder.png";
    if (!p.photoUrl) return placeholder;
    if (p.photoUrl.startsWith("http")) return p.photoUrl;
    const base = process.env.NEXT_PUBLIC_API_BASE || "";
    return `${base}${p.photoUrl}`;
  }

  // Función para eliminar mascota
  async function handleDelete(petId: string) {
    if (!confirm("¿Estás seguro que quieres eliminar esta mascota?")) return;
    try {
      await api.delete(`/api/pets/${petId}`);
      setPets((prev) => prev.filter((p) => p.id !== petId));
    } catch (e: any) {
      console.error("Error eliminando mascota:", e);
      setError(e?.message || "No se pudo eliminar la mascota");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-ink flex ">
          <div className="card flex items-center gap-3">
            <PawPrint className="h-6 w-6 text-[--nh-primary]" />
            <span className="text-2xl font-semibold text-ink">Mis Mascotas</span>
          </div>
        </h1>

        <div className="flex items-center gap-3">
          <Card>
            <div className="text-sm text-muted mr-4">
              Perfiles completos:{" "}
              <strong className="text-ink">{stats.completeCount}/{stats.total}</strong>
            </div>
          </Card>
          <button
            className="btn btn-primary flex items-center gap-2"
            onClick={() => setShowModal(true)}
          >
            <Plus className="h-4 w-4" />
            Agregar mascota
          </button>
        </div>
      </header>

      {/* Resumen pequeño */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
        <div className="card">
          <div className="text-sm text-muted">Completos</div>
          <div className="text-2xl font-semibold text-ink">{stats.completeCount}</div>
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
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-semibold text-ink truncate">{p.name}</h3>
                      {p.complete ? (
                        <span className="text-xs rounded-full bg-green-100 text-green-800 px-3 py-1">
                          Perfil completo
                        </span>
                      ) : (
                        <button
                          className="text-xs rounded-full bg-yellow-50 text-yellow-800 px-3 py-1"
                          onClick={() => {
                            if (p.nutrition) {
                              router.push(`/pets/${p.id}/diseases?wizard=1`);
                            } else {
                              router.push(`/pets/${p.id}/nutrition?wizard=1`);
                            }
                          }}
                        >
                          Completar perfil
                        </button>
                      )}
                    </div>

                    <p className="text-sm text-muted mt-1">
                      {p.species === "DOG" ? "Perro" : p.species === "CAT" ? "Gato" : "Otro"} •{" "}
                      {p.sex === "MALE" ? "Macho" : "Hembra"}
                      {p.breed ? ` • ${p.breed}` : ""} {p.size ? ` • ${SIZE_LABELS[p.size]}` : ""}
                      {p.weightKg ? ` • ${p.weightKg} kg` : ""}
                      {p.sterilized && (
                        <span className="ml-2 inline-block text-xs rounded-full border px-2 py-0.5">
                          Esterilizado
                        </span>
                      )}
                    </p>

                    {/* Estado nutrición / enfermedades */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <div className="text-xs px-2 py-1 rounded-md border bg-white">
                        Nutrición:{" "}
                        <strong className={`ml-1 ${p.nutrition ? "text-green-700" : "text-yellow-800"}`}>
                          {p.nutrition ? "Completada" : "Pendiente"}
                        </strong>
                      </div>

                      <div className="text-xs px-2 py-1 rounded-md border bg-white">
                        Enfermedades:{" "}
                        <strong
                          className={`ml-1 ${
                            p.diseasesCount && p.diseasesCount > 0
                              ? "text-ink"
                              : p.noDiseasesAck
                              ? "text-green-700"
                              : "text-red-600"
                          }`}
                        >
                          {p.diseasesCount && p.diseasesCount > 0
                            ? p.diseasesCount
                            : p.noDiseasesAck
                            ? "Sin enfermedades"
                            : "Sin completar"}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <a className="btn btn-outline" href={`/pets/${p.id}`}>Administrar</a>
                  {!p.complete && (
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        if (p.nutrition) {
                          router.push(`/pets/${p.id}/diseases?wizard=1`);
                        } else {
                          router.push(`/pets/${p.id}/nutrition?wizard=1`);
                        }
                      }}
                    >
                      Completar
                    </button>
                  )}
                  <button
                    className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-1"
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
            await load();
            setShowModal(false);
          }}
        />
      )}

      {error && (
        <div className="text-red-600 text-sm mt-2">
          {error}
        </div>
      )}
    </div>
  );
}
