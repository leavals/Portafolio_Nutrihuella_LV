"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { DOG_BREEDS, SIZES, SIZE_LABELS } from "@/constants/pets";

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

export default function AddPetModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<any>({
    name: "",
    species: "DOG",
    sex: "MALE",
    breed: "",
    weightKg: "",
    sterilized: false,
    size: "MEDIUM",
    birthDate: "",
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

  // foco inicial
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const weight = Number(form.weightKg);
    if (isNaN(weight) || weight <= 0 || weight > 200) {
      alert("Por favor, ingresa un peso válido (entre 0.1 kg y 200 kg).");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        species: form.species,
        sex: form.sex,
        breed: form.breed?.trim() || undefined,
        size: form.size,
        birthDate: form.birthDate,
        weightKg: weight,
        sterilized: !!form.sterilized,
      };
      await api.post("/api/pets", payload);
      onCreated();
    } catch (err: any) {
      alert(err?.message || "No se pudo crear la mascota");
    } finally {
      setSubmitting(false);
    }
  }

  // limitar fecha a hoy
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const maxDate = `${yyyy}-${mm}-${dd}`;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl rounded-2xl overflow-hidden bg-white shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="relative hidden sm:block">
              <img
                src="/nutrihuella/recipe-thumb.png"
                alt="Ilustración"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src="/nutrihuella/logo-mark.png"
                  alt="NutriHuella"
                  className="h-24 w-24 rounded-full bg-white/90 p-2 shadow-md"
                />
              </div>
            </div>

            <div className="p-6 sm:p-7">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold">Agregar mascota</h2>
                <button onClick={onClose} aria-label="Cerrar">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="label" htmlFor="name">
                    Nombre *
                  </label>
                  <input
                    ref={firstFieldRef}
                    id="name"
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="label" htmlFor="birthDate">
                    Fecha de nacimiento *
                  </label>
                  <input
                    id="birthDate"
                    className="input"
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                    required
                    max={maxDate}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {form.birthDate
                      ? `Edad estimada: ${formatAge(form.birthDate)}`
                      : "Selecciona una fecha"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label" htmlFor="species">
                      Especie *
                    </label>
                    <select
                      id="species"
                      className="input"
                      value={form.species}
                      onChange={(e) => setForm({ ...form, species: e.target.value })}
                      required
                    >
                      <option value="DOG">Perro</option>
                      <option value="CAT">Gato</option>
                      <option value="OTHER">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="sex">
                      Sexo *
                    </label>
                    <select
                      id="sex"
                      className="input"
                      value={form.sex}
                      onChange={(e) => setForm({ ...form, sex: e.target.value })}
                      required
                    >
                      <option value="MALE">Macho</option>
                      <option value="FEMALE">Hembra</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="breed">
                    Raza *
                  </label>
                  {form.species === "DOG" ? (
                    <>
                      <input
                        id="breed"
                        className="input"
                        list="dog-breeds"
                        placeholder="Escribe para buscar…"
                        value={form.breed}
                        onChange={(e) =>
                          setForm({ ...form, breed: e.target.value })
                        }
                        required
                      />
                      <datalist id="dog-breeds">
                        {DOG_BREEDS.map((b) => (
                          <option key={b} value={b} />
                        ))}
                      </datalist>
                    </>
                  ) : (
                    <input
                      id="breed"
                      className="input"
                      placeholder="Raza"
                      value={form.breed}
                      onChange={(e) => setForm({ ...form, breed: e.target.value })}
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="label" htmlFor="size">
                    Tamaño *
                  </label>
                  <select
                    id="size"
                    className="input"
                    value={form.size}
                    onChange={(e) => setForm({ ...form, size: e.target.value })}
                    required
                  >
                    {SIZES.map((v) => (
                      <option key={v} value={v}>
                        {SIZE_LABELS[v]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label" htmlFor="weight">
                    Peso (kg) *
                  </label>
                  <input
                    id="weight"
                    className="input"
                    type="number"
                    step="0.01"
                    min={0.1}
                    max={200}
                    value={form.weightKg}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        weightKg: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Ingresa un valor entre 0.1 y 200 kg.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="sterilized"
                    type="checkbox"
                    className="h-4 w-4"
                    checked={!!form.sterilized}
                    onChange={(e) =>
                      setForm({ ...form, sterilized: e.target.checked })
                    }
                  />
                  <label className="label" htmlFor="sterilized">
                    Esterilizado
                  </label>
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
                    disabled={
                      submitting ||
                      !form.name ||
                      !form.birthDate ||
                      !form.breed ||
                      !form.weightKg
                    }
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

/* Helpers edad */
function calculateAge(birthDateStr: string): number {
  const birth = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function formatAge(birthDateStr: string): string {
  const years = calculateAge(birthDateStr);
  if (years > 0) return `${years} ${years === 1 ? "año" : "años"}`;

  const birth = new Date(birthDateStr);
  const today = new Date();
  let months =
    (today.getFullYear() - birth.getFullYear()) * 12 +
    (today.getMonth() - birth.getMonth());
  if (today.getDate() < birth.getDate()) months = Math.max(0, months - 1);

  return months > 0
    ? `${months} ${months === 1 ? "mes" : "meses"}`
    : "menos de 1 mes";
}
