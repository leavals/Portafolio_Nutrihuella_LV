"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button, Card, Field, Input } from "@/components/ui";

type Row = { id: string; date: string; weightKg: number };
const isoToYmd = (d: string) => new Date(d).toISOString().slice(0,10);

export default function WeightsPage() {
  const params = useParams<{ id: string }>();
  const petId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    if (!petId) return;
    setLoading(true); setErr(null);
    try {
      const data = await api.get<Row[]>(`/api/pets/${petId}/clinical/weights`);
      setRows(data);
    } catch (e: any) {
      setErr(e?.message || "No se pudo cargar pesos");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load();/* eslint-disable-next-line */ }, [petId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const date = (document.getElementById("w_date") as HTMLInputElement).value;
    const weightKgStr = (document.getElementById("w_kg") as HTMLInputElement).value;
    if (!date || !weightKgStr) return alert("Fecha y peso requeridos");
    await api.post(`/api/pets/${petId}/clinical/weights`, { date, weightKg: Number(weightKgStr) });
    (document.getElementById("w_date") as HTMLInputElement).value = "";
    (document.getElementById("w_kg") as HTMLInputElement).value = "";
    load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar registro de peso?")) return;
    await api.del(`/api/pets/${petId}/clinical/weights/${id}`);
    load();
  }

  return (
    <div className="space-y-4">
      <Link href={`/pets/${petId}`} className="text-sm underline">← Volver</Link>
      <h1 className="text-2xl font-semibold">Pesos</h1>

      <Card>
        <form onSubmit={add} className="grid sm:grid-cols-3 gap-3">
          <Field label="Fecha">
            <Input id="w_date" type="date" />
          </Field>
          <Field label="Peso (kg)">
            <Input id="w_kg" type="number" step="0.1" min="0" placeholder="12.5" />
          </Field>
          <div className="flex items-end">
            <Button type="submit">Agregar</Button>
          </div>
        </form>
      </Card>

      <Card>
        {loading ? <p>Cargando…</p> : err ? <p className="text-red-600">{err}</p> : (
          <div className="space-y-2">
            {rows.length === 0 && <p className="text-sm text-slate-500">Sin registros.</p>}
            {rows.map(r => (
              <div key={r.id} className="flex items-center justify-between border rounded-lg p-3 bg-white">
                <div className="text-sm">
                  <span className="font-medium">{isoToYmd(r.date)}</span> — {r.weightKg} kg
                </div>
                <Button variant="danger" onClick={() => remove(r.id)}>Eliminar</Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
