"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button, Card, Field, Input } from "@/components/ui";

type Row = { id: string; name: string; date: string };

const isoToYmd = (d: string) => new Date(d).toISOString().slice(0,10);

export default function VaccinesPage() {
  const params = useParams<{ id: string }>();
  const petId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    if (!petId) return;
    setLoading(true); setErr(null);
    try {
      const data = await api.get<Row[]>(`/api/pets/${petId}/clinical/vaccinations`);
      setRows(data);
    } catch (e: any) {
      setErr(e?.message || "No se pudo cargar vacunas");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load();/* eslint-disable-next-line */ }, [petId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const name = (document.getElementById("v_name") as HTMLInputElement).value.trim();
    const date = (document.getElementById("v_date") as HTMLInputElement).value;
    if (!name || !date) return alert("Nombre y fecha requeridos");
    await api.post(`/api/pets/${petId}/clinical/vaccinations`, { name, date });
    (document.getElementById("v_name") as HTMLInputElement).value = "";
    (document.getElementById("v_date") as HTMLInputElement).value = "";
    load();
  }

  async function save(row: Row) {
    await api.patch(`/api/pets/${petId}/clinical/vaccinations/${row.id}`, { name: row.name, date: row.date });
    load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar vacuna?")) return;
    await api.del(`/api/pets/${petId}/clinical/vaccinations/${id}`);
    load();
  }

  return (
    <div className="space-y-4">
      <Link href={`/pets/${petId}`} className="text-sm underline">← Volver</Link>
      <h1 className="text-2xl font-semibold">Vacunas</h1>

      <Card>
        <form onSubmit={add} className="grid sm:grid-cols-3 gap-3">
          <Field label="Nombre">
            <Input id="v_name" placeholder="Antirrábica" />
          </Field>
          <Field label="Fecha">
            <Input id="v_date" type="date" />
          </Field>
          <div className="flex items-end">
            <Button type="submit">Agregar</Button>
          </div>
        </form>
      </Card>

      <Card>
        {loading ? <p>Cargando…</p> : err ? <p className="text-red-600">{err}</p> : (
          <div className="space-y-3">
            {rows.length === 0 && <p className="text-sm text-slate-500">Sin registros.</p>}
            {rows.map(r => (
              <div key={r.id} className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between border rounded-lg p-3 bg-white">
                <div className="flex-1 grid sm:grid-cols-2 gap-2">
                  <Input
                    value={r.name}
                    onChange={e => setRows(rows.map(x => x.id === r.id ? { ...x, name: e.target.value } : x))}
                  />
                  <Input
                    type="date"
                    value={isoToYmd(r.date)}
                    onChange={e => setRows(rows.map(x => x.id === r.id ? { ...x, date: e.target.value } : x))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => save(r)}>Guardar</Button>
                  <Button variant="danger" onClick={() => remove(r.id)}>Eliminar</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
