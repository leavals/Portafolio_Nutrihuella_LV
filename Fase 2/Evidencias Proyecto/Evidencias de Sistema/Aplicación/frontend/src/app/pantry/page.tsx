"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import { Button, Card, Field, Input, Select } from "@/components/ui";

/* ----------------------------- Tipos ----------------------------- */
type Item = {
  id: number;
  name: string;
  keywordsCsv?: string | null;
  quantity?: number | null;
  unit?: string | null;
  category?: string | null; // Enum string en backend (PROTEIN, VEGGIE, etc.)
  purchasedAt?: string | null; // YYYY-MM-DD
  expiresAt?: string | null;   // YYYY-MM-DD
  notes?: string | null;
};

/* --------------------- Categorías (ES -> enum) -------------------- */
const CATS_UI = [
  { es: "Proteínas",     enum: "PROTEIN" },
  { es: "Verduras",      enum: "VEGGIE"  },
  { es: "Frutas",        enum: "FRUIT"   },
  { es: "Carbohidratos", enum: "CARB"    },
  { es: "Grasas",        enum: "FAT"     },
  { es: "Suplementos",   enum: "SUPPLEMENT" },
  { es: "Otros",         enum: "OTROS"   },
] as const;

const UNITS = ["g", "kg", "ml", "L", "unid"] as const;

/* --------------------------- Utilidades -------------------------- */
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

type FormState = {
  name: string;
  quantity: string;
  unit: string;
  categoryEs: string;      // "Proteínas", "Verduras", ...
  keywordsCsv: string;
  purchasedAt: string;     // YYYY-MM-DD
  expiresAt: string;       // YYYY-MM-DD
  notes: string;
};

export default function PantryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Modal + form
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [f, setF] = useState<FormState>(() => {
    const today = new Date();
    return {
      name: "",
      quantity: "",
      unit: "",
      categoryEs: "",
      keywordsCsv: "",
      purchasedAt: toISODate(today),
      expiresAt: toISODate(addMonths(today, 3)),
      notes: "",
    };
  });

  // Errores de validación front (sin usar prop en Field)
  const [fv, setFv] = useState<Partial<Record<keyof FormState, string>>>({});

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const res = await api.get<Item[]>("/api/pantry");
      const data = Array.isArray((res as any)?.data) ? (res as any).data : (res as any);
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr(e?.message || "No se pudo cargar la despensa");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function openModal() {
    const today = new Date();
    setF({
      name: "",
      quantity: "",
      unit: "",
      categoryEs: "",
      keywordsCsv: "",
      purchasedAt: toISODate(today),
      expiresAt: toISODate(addMonths(today, 3)),
      notes: "",
    });
    setFv({});
    setOpen(true);
  }

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
    if (!f.categoryEs) next.categoryEs = "Requerido";
    if (!f.purchasedAt) next.purchasedAt = "Requerido";
    if (!f.expiresAt) next.expiresAt = "Requerido";
    setFv(next);
    return Object.keys(next).length === 0;
  }

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

      setOpen(false);
      await load();
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

  async function del(id: number) {
    if (!confirm("¿Eliminar ingrediente?")) return;
    setErr(null);
    try {
      await api.delete(`/api/pantry/${id}`);
      await load();
    } catch (e: any) {
      setErr(e?.message || "No se pudo eliminar");
    }
  }

  const filtered = useMemo(() => {
    const q = (search ?? "").trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      i.name?.toLowerCase().includes(q) ||
      i.category?.toLowerCase().includes(q) ||
      i.keywordsCsv?.toLowerCase().includes(q)
    );
  }, [items, search]);

  const FieldError = ({ msg, id }: { msg?: string; id: string }) =>
    msg ? <small id={id} className="text-xs text-red-600">{msg}</small> : null;

  return (
    <div className="space-y-6">
      {/* Header + acciones */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Mi despensa</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button onClick={openModal} className="inline-flex items-center gap-2">
            + Agregar ingrediente
          </Button>
        </div>
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}

      {/* Inventario */}
      <Card>
        {loading ? (
          <p>Cargando…</p>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-slate-500">
            No hay ingredientes.{" "}
            <button className="underline" onClick={openModal}>Agrega el primero</button>.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((it) => {
              const expired = it.expiresAt && new Date(it.expiresAt) < new Date();
              const soon = it.expiresAt && new Date(it.expiresAt) < new Date(Date.now() + 3 * 86400000);
              return (
                <div key={it.id} className="border rounded-xl p-4 bg-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-sm text-slate-500">
                        {(CATS_UI.find(c => c.enum === (it.category ?? ""))?.es) ?? "Otros"} • {it.quantity ?? "—"} {it.unit ?? ""}
                      </div>
                      {it.expiresAt && (
                        <div className={`text-xs mt-1 ${expired ? "text-red-600" : soon ? "text-orange-600" : "text-slate-500"}`}>
                          Caduca: {new Date(it.expiresAt).toLocaleDateString()}
                        </div>
                      )}
                      {it.keywordsCsv ? <div className="text-xs text-slate-400 mt-1">Sinónimos: {it.keywordsCsv}</div> : null}
                      {it.notes ? <div className="text-xs text-slate-400 mt-1">Notas: {it.notes}</div> : null}
                    </div>
                    <Button variant="danger" onClick={() => del(it.id)}>Eliminar</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ===== Modal con diseño tipo Login ===== */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-1 md:grid-cols-2 bg-white">
              {/* Columna imagen */}
              <div className="relative min-h-[380px] hidden md:block">
                <Image src="/nutrihuella/recipe-thumb.png" alt="NutriHuella" fill className="object-cover" priority />
                <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-40 w-40 rounded-full bg-white/95 shadow-lg grid place-items-center">
                    <Image src="/nutrihuella/logo-mark.png" alt="Logo" width={96} height={96} />
                  </div>
                </div>
              </div>

              {/* Columna formulario */}
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-2xl font-semibold text-ink">Agregar ingrediente</h2>
                  <button onClick={() => setOpen(false)} aria-label="Cerrar" className="rounded-full px-3 py-1.5 text-slate-500 hover:bg-slate-100">
                    ×
                  </button>
                </div>

                <p className="text-sm text-muted mb-6">
                  Completa los campos requeridos. La caducidad se calcula +3 meses desde la compra.
                </p>

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
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </Select>
                    <FieldError id="err-unit" msg={fv.unit} />
                  </Field>

                  <Field label="Categoría*">
                    <Select
                      aria-invalid={!!fv.categoryEs}
                      aria-describedby="err-category"
                      value={f.categoryEs}
                      onChange={(e) => setF({ ...f, categoryEs: e.target.value })}
                      required
                    >
                      <option value="">Selecciona…</option>
                      {CATS_UI.map((c) => <option key={c.enum} value={c.es}>{c.es}</option>)}
                    </Select>
                    <FieldError id="err-category" msg={fv.categoryEs} />
                  </Field>

                  <Field label="Sinónimos (CSV)">
                    <Input
                      value={f.keywordsCsv}
                      onChange={(e) => setF({ ...f, keywordsCsv: e.target.value })}
                      placeholder="pollo,pechuga,ave"
                    />
                  </Field>

                  <div className="hidden md:block" />

                  <Field label="Compra*">
                    <Input
                      type="date"
                      aria-invalid={!!fv.purchasedAt}
                      aria-describedby="err-purchased"
                      value={f.purchasedAt}
                      onChange={(e) => onChangePurchasedAt(e.target.value)}
                      required
                    />
                    <FieldError id="err-purchased" msg={fv.purchasedAt} />
                  </Field>

                  <Field label="Caducidad*">
                    <Input
                      type="date"
                      aria-invalid={!!fv.expiresAt}
                      aria-describedby="err-expires"
                      value={f.expiresAt}
                      onChange={(e) => setF({ ...f, expiresAt: e.target.value })}
                      required
                    />
                    <FieldError id="err-expires" msg={fv.expiresAt} />
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
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Guardando…" : "Guardar"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ===== /Modal ===== */}
    </div>
  );
}
