"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button, Card, Input } from "@/components/ui";
import { Trash2, Utensils } from "lucide-react";
import AddIngredientModal from "@/components/pantry/AddIngredientModal";

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

export default function PantryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Modal
  const [open, setOpen] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Header + acciones (diseño intacto) */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-ink flex ">
          <div className="card flex items-center gap-3">
            <Utensils className="h-6 w-6 text-[--nh-primary]" />
            <span className="text-2xl font-semibold text-ink">Mi Despensa</span>
          </div>
        </h1>
        <div className="flex items-center gap-2">
          <Input placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button onClick={() => setOpen(true)} className="inline-flex items-center gap-2">
            + Agregar ingrediente
          </Button>
        </div>
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}

      {/* Inventario (diseño intacto) */}
      <Card>
        {loading ? (
          <p>Cargando…</p>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-slate-500">
            No hay ingredientes.{" "}
            <button className="underline" onClick={() => setOpen(true)}>Agrega el primero</button>.
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
                    <Button
                      type="button"
                      onClick={() => del(it.id)}
                      className="bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 p-2 rounded-md"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal externalizado con el MISMO diseño */}
      {open && (
        <AddIngredientModal
          onClose={() => setOpen(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}
