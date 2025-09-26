"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button, Card, Field, Input, Select } from "@/components/ui";

type Item = {
  id: string;
  name: string;
  keywordsCsv?: string | null;
  quantity?: number | null;
  unit?: string | null;
  category?: string | null;
  purchasedAt?: string | null;
  expiresAt?: string | null;
  notes?: string | null;
};

const CATS = ["PROTEIN", "VEGGIE", "FRUIT", "CARB", "FAT", "SUPPLEMENT", "OTROS"];
const UNITS = ["g","kg","ml","L","unid"];

export default function PantryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState<any>({
    name: "",
    quantity: "",
    unit: "",
    category: "",
    keywordsCsv: "",
    purchasedAt: "",
    expiresAt: "",
    notes: ""
  });
  const [search, setSearch] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      // ⬇️ CORREGIDO: ahora pega a /api/pantry
      const data = await api.get<Item[]>("/api/pantry");
      setItems(data);
    } catch (e: any) {
      setErr(e?.message || "No se pudo cargar la despensa");
    } finally {
      setLoading(false);
    }
  }
  useEffect(()=>{ load(); },[]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await api.post("/api/pantry", {
        name: f.name,
        quantity: f.quantity ? Number(f.quantity) : null,
        unit: f.unit || null,
        category: f.category || null,
        keywordsCsv: f.keywordsCsv || null,
        purchasedAt: f.purchasedAt || undefined,
        expiresAt: f.expiresAt || undefined,
        notes: f.notes || undefined
      });
      setF({
        name: "",
        quantity: "",
        unit: "",
        category: "",
        keywordsCsv: "",
        purchasedAt: "",
        expiresAt: "",
        notes: ""
      });
      await load();
    } catch (e: any) {
      setErr(e?.message || "No se pudo agregar el ingrediente");
    }
  }

  async function del(id: string) {
    if (!confirm("¿Eliminar ingrediente?")) return;
    setErr(null);
    try {
      // ⬇️ CORREGIDO: ahora pega a /api/pantry/:id
      await api.delete(`/api/pantry/${id}`);
      await load();
    } catch (e: any) {
      setErr(e?.message || "No se pudo eliminar");
    }
  }

  const filtered = useMemo(()=>{
    const q = (search ?? "").trim().toLowerCase();
    if (!q) return items;
    return items.filter(i =>
      (i.name?.toLowerCase().includes(q)) ||
      (i.category?.toLowerCase().includes(q)) ||
      (i.keywordsCsv?.toLowerCase().includes(q))
    );
  },[items, search]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Mi despensa</h1>

      <Card>
        <h2 className="text-lg font-semibold mb-2">Agregar ingrediente</h2>
        <form onSubmit={add} className="grid md:grid-cols-7 gap-3" noValidate>
          <Field label="Nombre*">
            <Input value={f.name} onChange={e=>setF({...f, name:e.target.value})} required/>
          </Field>
          <Field label="Cantidad">
            <Input type="number" inputMode="decimal" step="0.01" value={f.quantity} onChange={e=>setF({...f, quantity:e.target.value})}/>
          </Field>
          <Field label="Unidad">
            <Select value={f.unit} onChange={e=>setF({...f, unit:e.target.value})}>
              <option value="">—</option>
              {UNITS.map(u=> <option key={u} value={u}>{u}</option>)}
            </Select>
          </Field>
          <Field label="Categoría">
            <Select value={f.category} onChange={e=>setF({...f, category:e.target.value})}>
              <option value="">—</option>
              {CATS.map(c=> <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Sinónimos (CSV)">
            <Input value={f.keywordsCsv} onChange={e=>setF({...f, keywordsCsv:e.target.value})} placeholder="pollo,pechuga,ave"/>
          </Field>
          <Field label="Compra">
            <Input type="date" value={f.purchasedAt} onChange={e=>setF({...f, purchasedAt:e.target.value})}/>
          </Field>
          <Field label="Caducidad">
            <Input type="date" value={f.expiresAt} onChange={e=>setF({...f, expiresAt:e.target.value})}/>
          </Field>

          <div className="md:col-span-7">
            <Field label="Notas">
              <Input value={f.notes} onChange={e=>setF({...f, notes:e.target.value})} placeholder="Observaciones (opcional)"/>
            </Field>
          </div>

          <div className="md:col-span-7 flex items-center justify-between">
            {err && <div className="text-sm text-red-600">{err}</div>}
            <Button type="submit">Agregar</Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Inventario</h2>
          <Input placeholder="Buscar…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>

        {loading ? <p>Cargando…</p> : (
          filtered.length === 0 ? (
            <p className="text-sm text-slate-500">Sin resultados.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(it=> {
                const expired = it.expiresAt && new Date(it.expiresAt) < new Date();
                const soon = it.expiresAt && new Date(it.expiresAt) < new Date(Date.now() + 3*86400000);
                return (
                  <div key={it.id} className="border rounded-xl p-4 bg-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{it.name}</div>
                        <div className="text-sm text-slate-500">
                          {it.category ?? "OTROS"} • {it.quantity ?? "—"} {it.unit ?? ""}
                        </div>
                        {it.expiresAt && (
                          <div className={`text-xs mt-1 ${expired? "text-red-600" : soon? "text-orange-600" : "text-slate-500"}`}>
                            Caduca: {new Date(it.expiresAt).toLocaleDateString()}
                          </div>
                        )}
                        {it.keywordsCsv ? <div className="text-xs text-slate-400 mt-1">Sinónimos: {it.keywordsCsv}</div> : null}
                        {it.notes ? <div className="text-xs text-slate-400 mt-1">Notas: {it.notes}</div> : null}
                      </div>
                      <Button variant="danger" onClick={()=>del(it.id)}>Eliminar</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </Card>
    </div>
  );
}
