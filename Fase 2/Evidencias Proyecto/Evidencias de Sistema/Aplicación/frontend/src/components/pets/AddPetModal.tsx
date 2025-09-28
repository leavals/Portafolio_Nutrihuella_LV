"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";

type Props = {
  onClose: () => void;
  onCreated: () => void; // se llama al crear OK
};

export default function AddPetModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<any>({
    name: "",
    species: "DOG",
    sex: "MALE",
    breed: "",
    weightKg: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // cerrar con ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // pequeña trampita de foco inicial
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => { firstFieldRef.current?.focus(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        species: form.species,
        sex: form.sex,
        breed: form.breed?.trim() || undefined,
        weightKg:
          form.weightKg === "" || form.weightKg === null
            ? null
            : Number(form.weightKg),
      };
      await api.post("/api/pets", payload);
      onCreated();
    } catch (err: any) {
      alert(err?.message || "No se pudo crear la mascota");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-pet-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Contenedor modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl rounded-2xl overflow-hidden bg-white shadow-xl">
          {/* Layout lado-izq imagen / lado-der formulario */}
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {/* Izquierda: imagen (la misma del home para mantener estilo) */}
            <div className="relative hidden sm:block">
              <img
                src="/nutrihuella/recipe-thumb.png"
                alt="Ilustración"
                className="h-full w-full object-cover"
              />
              {/* Logo circular encima */}
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src="/nutrihuella/logo-mark.png"
                  alt="NutriHuella"
                  className="h-24 w-24 rounded-full bg-white/90 p-2 shadow-md"
                />
              </div>
            </div>

            {/* Derecha: formulario */}
            <div className="p-6 sm:p-7">
              <div className="flex items-start justify-between">
                <h2 id="add-pet-title" className="text-xl font-semibold text-ink">
                  Agregar mascota
                </h2>
                <button
                  className="text-muted hover:text-ink"
                  onClick={onClose}
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="label" htmlFor="name">Nombre</label>
                  <input
                    ref={firstFieldRef}
                    id="name"
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label" htmlFor="species">Especie</label>
                    <select
                      id="species"
                      className="input"
                      value={form.species}
                      onChange={(e) => setForm({ ...form, species: e.target.value })}
                    >
                      <option value="DOG">Perro</option>
                      <option value="CAT">Gato</option>
                      <option value="OTHER">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="sex">Sexo</label>
                    <select
                      id="sex"
                      className="input"
                      value={form.sex}
                      onChange={(e) => setForm({ ...form, sex: e.target.value })}
                    >
                      <option value="MALE">Macho</option>
                      <option value="FEMALE">Hembra</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="breed">Raza (opcional)</label>
                  <input
                    id="breed"
                    className="input"
                    value={form.breed}
                    onChange={(e) => setForm({ ...form, breed: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label" htmlFor="weight">Peso (kg)</label>
                  <input
                    id="weight"
                    className="input"
                    type="number"
                    step="0.01"
                    value={form.weightKg}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        weightKg: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    className="btn btn-outline flex-1"
                    onClick={onClose}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-1 disabled:opacity-50"
                    disabled={submitting || !form.name}
                  >
                    {submitting ? "Creando…" : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
