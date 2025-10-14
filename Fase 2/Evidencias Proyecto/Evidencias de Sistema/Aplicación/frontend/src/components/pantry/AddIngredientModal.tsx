"use client";

import Image from "next/image";
import { useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Button, Field, Input, Select } from "@/components/ui";
import {
  normalizeIngredientName,
  getDefaultIngredientKeywords,
} from "@/constants/ingredient-synonyms";

/* === Constantes === */
const CATS_UI = [
  { es: "Proteínas", enum: "PROTEIN" },
  { es: "Verduras", enum: "VEGGIE" },
  { es: "Frutas", enum: "FRUIT" },
  { es: "Carbohidratos", enum: "CARB" },
  { es: "Grasas", enum: "FAT" },
  { es: "Suplementos", enum: "SUPPLEMENT" },
  { es: "Otros", enum: "OTROS" },
] as const;

const UNITS = ["g", "kg", "ml", "L", "unid"] as const;

/* === Utils === */
function toISODate(d: Date) {
  const z = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  return z.toISOString().slice(0, 10);
}
function addMonths(date: Date, months: number) {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0);
  return d;
}
function normISO(s?: string) {
  if (!s) return undefined;
  return s.length === 10 ? s : new Date(s).toISOString().slice(0, 10);
}

/* === Tipos === */
type FormState = {
  name: string;
  quantity: string;
  unit: string;
  categoryEs: string;
  keywordsCsv: string;
  purchasedAt: string;
  expiresAt: string;
  notes: string;
};

type Props = { onClose: () => void; onCreated: () => void };
type CategoryEs = (typeof CATS_UI)[number]["es"];

/* Heurística categoría (recortada por brevedad: igual a la tuya) */
const CATEGORY_GUESS: Record<string, CategoryEs> = {
  pollo: "Proteínas",
  res: "Proteínas",
  vacuno: "Proteínas",
  ternera: "Proteínas",
  cerdo: "Proteínas",
  pavo: "Proteínas",
  pato: "Proteínas",
  cordero: "Proteínas",
  conejo: "Proteínas",
  venado: "Proteínas",
  pescado: "Proteínas",
  salmon: "Proteínas",
  atun: "Proteínas",
  sardina: "Proteínas",
  bacalao: "Proteínas",
  trucha: "Proteínas",
  merluza: "Proteínas",
  huevo: "Proteínas",
  higado: "Proteínas",
  visceras: "Proteínas",
  rinon: "Proteínas",
  zanahoria: "Verduras",
  brocoli: "Verduras",
  coliflor: "Verduras",
  repollo: "Verduras",
  espinaca: "Verduras",
  acelga: "Verduras",
  pepino: "Verduras",
  tomate: "Verduras",
  lechuga: "Verduras",
  manzana: "Frutas",
  platano: "Frutas",
  pera: "Frutas",
  naranja: "Frutas",
  uva: "Frutas",
  arroz: "Carbohidratos",
  maiz: "Carbohidratos",
  trigo: "Carbohidratos",
  avena: "Carbohidratos",
  quinoa: "Carbohidratos",
  "aceite de oliva": "Grasas",
  "aceite de pescado": "Grasas",
  "omega 3": "Suplementos",
  taurina: "Suplementos",
  /* … */
};

export default function AddIngredientModal({ onClose, onCreated }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [synLoadKey, setSynLoadKey] = useState<string | null>(null);

  const today = new Date();
  const [f, setF] = useState<FormState>({
    name: "",
    quantity: "",
    unit: "",
    categoryEs: "",
    keywordsCsv: "",
    purchasedAt: toISODate(today),
    expiresAt: toISODate(addMonths(today, 3)),
    notes: "",
  });

  const [fv, setFv] = useState<Partial<Record<keyof FormState, string>>>({});

  // Habilitar/Deshabilitar Guardar
  const canSubmit = useMemo(() => {
    const hasName = f.name.trim().length > 0;
    const qtyOk = f.quantity !== "" && !Number.isNaN(Number(f.quantity));
    const unitOk = !!f.unit;
    return hasName && qtyOk && unitOk && !submitting;
  }, [f.name, f.quantity, f.unit, submitting]);

  function onChangePurchasedAt(v: string) {
    const purchase = v ? new Date(v + "T00:00:00") : new Date();
    const exp = addMonths(purchase, 3);
    setF((s) => ({ ...s, purchasedAt: v, expiresAt: toISODate(exp) }));
  }

  function validateFront(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!f.name.trim()) next.name = "Requerido";
    if (f.quantity === "" || Number.isNaN(Number(f.quantity))) next.quantity = "Requerido";
    if (!f.unit) next.unit = "Requerido";
    setFv(next);
    return Object.keys(next).length === 0;
  }

  const FieldError = ({ msg, id }: { msg?: string; id: string }) =>
    msg ? <small id={id} className="text-xs text-red-600">{msg}</small> : null;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!validateFront()) return;

    setSubmitting(true);
    try {
      const cat = CATS_UI.find((c) => c.es === f.categoryEs)?.enum || undefined;
      const body: Record<string, any> = {
        name: f.name.trim(),
        quantity: Number(f.quantity),
        unit: f.unit.toUpperCase(),
        category: cat,
        purchasedAt: normISO(f.purchasedAt),
        expiresAt: normISO(f.expiresAt),
      };
      if (f.keywordsCsv.trim()) body.keywordsCsv = f.keywordsCsv.trim();
      if (f.notes.trim()) body.notes = f.notes.trim();

      await api.post("/api/pantry", body);
      onClose();
      onCreated();
    } catch (e: any) {
      const msg =
        e?.data?.issues?.[0]?.message ||
        e?.data?.message ||
        e?.message ||
        "No se pudo agregar el ingrediente";
      setErr(msg);
      console.error("POST /api/pantry error:", e);
    } finally {
      setSubmitting(false);
    }
  }

  /* ====== Botón "Cargar" ====== */
  function onLoadFromDictionary() {
    const key = normalizeIngredientName(f.name || "");
    if (!key) return;

    const defs = getDefaultIngredientKeywords(key);
    setF((s) => ({ ...s, keywordsCsv: (defs && defs.length ? defs.join(",") : "") }));

    if (!f.categoryEs) {
      const guessEs = CATEGORY_GUESS[key];
      if (guessEs) setF((s) => ({ ...s, categoryEs: guessEs }));
      else if (
        ["pollo","res","vacuno","cerdo","pavo","pato","cordero","conejo","venado","pescado","salmon","atun","huevo","higado","visceras","rinon"]
          .some(w => key.includes(w))
      ) setF((s) => ({ ...s, categoryEs: "Proteínas" }));
      else if (["aceite","grasa"].some(w => key.includes(w)))
        setF((s) => ({ ...s, categoryEs: "Grasas" }));
      else if (
        ["arroz","maiz","trigo","avena","quinoa","amaranto","papa","camote","boniato","yuca","tapioca","cebada","centeno","sorgo","mijo"]
          .some(w => key.includes(w))
      ) setF((s) => ({ ...s, categoryEs: "Carbohidratos" }));
      else if (
        ["manzana","platano","pera","naranja","mandarina","limon","arandano","fresa","mora","frambuesa","coco","uva"]
          .some(w => key.includes(w))
      ) setF((s) => ({ ...s, categoryEs: "Frutas" }));
      else if (
        ["zanahoria","brocoli","coliflor","repollo","espinaca","acelga","pepino","tomate","lechuga"]
          .some(w => key.includes(w))
      ) setF((s) => ({ ...s, categoryEs: "Verduras" }));
      else setF((s) => ({ ...s, categoryEs: "Otros" }));
    }

    setSynLoadKey(key); // bloquear hasta que cambie el nombre
  }

  const currentKey = normalizeIngredientName(f.name || "");
  const canLoad = currentKey.length > 0 && synLoadKey !== currentKey;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative z-10 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 bg-white">
          {/* Imagen */}
          <div className="relative min-h-[380px] hidden md:block">
            <Image src="/nutrihuella/recipe-thumb.png" alt="NutriHuella" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-40 w-40 rounded-full bg-white/95 shadow-lg grid place-items-center">
                <Image src="/nutrihuella/logo-mark.png" alt="Logo" width={96} height={96} />
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-2xl font-semibold text-ink">Agregar ingrediente</h2>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="rounded-full px-3 py-1.5 text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            {err && <div className="text-sm text-red-600 mb-2">{err}</div>}

            <p className="text-sm text-muted mb-6">
              Completa los campos requeridos. La caducidad se calcula +3 meses desde la compra.
            </p>

            {/* Grilla principal */}
            <form onSubmit={add} className="grid md:grid-cols-2 gap-3" noValidate>
              <Field label="Nombre*">
                <Input
                  aria-invalid={!!fv.name}
                  aria-describedby="err-name"
                  value={f.name}
                  onChange={(e) => setF({ ...f, name: e.target.value })}
                  required
                />
                <FieldError id="err-name" msg={fv.name} />
              </Field>

              <Field label="Cantidad*">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  aria-invalid={!!fv.quantity}
                  aria-describedby="err-quantity"
                  value={f.quantity}
                  onChange={(e) => setF({ ...f, quantity: e.target.value })}
                  required
                />
                <FieldError id="err-quantity" msg={fv.quantity} />
              </Field>

              <Field label="Unidad*">
                <Select
                  aria-invalid={!!fv.unit}
                  aria-describedby="err-unit"
                  value={f.unit}
                  onChange={(e) => setF({ ...f, unit: e.target.value })}
                  required
                >
                  <option value="">Selecciona…</option>
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </Select>
                <FieldError id="err-unit" msg={fv.unit} />
              </Field>

              <Field label="Categoría">
                <Select
                  aria-invalid={!!fv.categoryEs}
                  aria-describedby="err-category"
                  value={f.categoryEs}
                  onChange={(e) => setF({ ...f, categoryEs: e.target.value })}
                >
                  <option value="">(opcional)</option>
                  {CATS_UI.map((c) => (
                    <option key={c.enum} value={c.es}>
                      {c.es}
                    </option>
                  ))}
                </Select>
                <FieldError id="err-category" msg={fv.categoryEs} />
              </Field>

              {/* FILA: Sinónimos (izq) + Cargar (der) */}
              <Field label="Sinónimos (CSV)">
                <Input
                  value={f.keywordsCsv}
                  onChange={(e) => setF({ ...f, keywordsCsv: e.target.value })}
                  placeholder="pollo,pechuga,ave"
                />
              </Field>

              <div className="flex flex-col gap-2">
                {/* offset para alinear con label de la izquierda */}
                <div className="h-6 md:h-[26px]" aria-hidden />
                <Button
                  type="button"
                  onClick={onLoadFromDictionary}
                  disabled={!canLoad}
                  className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cargar
                </Button>
              </div>

              {/* FILA: Caducidad (izq) + Compra (der) => alineadas */}
              <Field label="Caducidad">
                <Input
                  type="date"
                  aria-invalid={!!fv.expiresAt}
                  aria-describedby="err-expires"
                  value={f.expiresAt}
                  onChange={(e) => setF({ ...f, expiresAt: e.target.value })}
                />
                <FieldError id="err-expires" msg={fv.expiresAt} />
              </Field>

              <Field label="Compra">
                <Input
                  type="date"
                  aria-invalid={!!fv.purchasedAt}
                  aria-describedby="err-purchased"
                  value={f.purchasedAt}
                  onChange={(e) => onChangePurchasedAt(e.target.value)}
                />
                <FieldError id="err-purchased" msg={fv.purchasedAt} />
              </Field>

              <div className="md:col-span-2">
                <Field label="Notas (opcional)">
                  <Input
                    value={f.notes}
                    onChange={(e) => setF({ ...f, notes: e.target.value })}
                    placeholder="Observaciones (opcional)"
                  />
                </Field>
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-2 mt-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Guardando…" : "Guardar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
