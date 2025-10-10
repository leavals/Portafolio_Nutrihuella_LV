"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button, Card, Field, Input } from "@/components/ui";

type Row = { id: string; date: string; weightKg: number };
type Current = { weightKg: number | null; date: string | null };
type ApiResp = Row[] | { current: Current | null; historics: Row[] };

const toYmdLocal = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Helper: desempaqueta api.get que puede traer { data } o el cuerpo directo
function unwrap<T>(resp: any): T {
  return (resp && typeof resp === "object" && "data" in resp ? resp.data : resp) as T;
}

export default function WeightHistoryPage() {
  const params = useParams();

  // Soportar rutas con [petId] o [id], y también arrays (catch-all)
  const petId = useMemo(() => {
    const candidate: any =
      (params as any)?.petId ??
      (params as any)?.id ??
      (Array.isArray((params as any)?.petId) ? (params as any).petId[0] : undefined) ??
      (Array.isArray((params as any)?.id) ? (params as any).id[0] : undefined);

    return typeof candidate === "string" ? candidate : undefined;
  }, [params]);

  const [rows, setRows] = useState<Row[]>([]);
  const [current, setCurrent] = useState<Current | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    if (!petId) return;
    setLoading(true);
    setErr(null);
    try {
      const resp = await api.get<ApiResp>(`/api/pets/${petId}/clinical/weights`);
      const data = unwrap<ApiResp>(resp);

      if (Array.isArray(data)) {
        // LEGACY: solo históricos → normalizamos para SIEMPRE mostrar "Peso actual"
        setRows(data);

        try {
          const petResp = await api.get<{ weightKg?: number | null; updatedAt?: string; createdAt?: string }>(
            `/api/pets/${petId}`
          );
          const pet = unwrap<{ weightKg?: number | null; updatedAt?: string; createdAt?: string }>(petResp);
          const dateStr = pet?.updatedAt || pet?.createdAt || null;
          setCurrent(
            pet && typeof pet.weightKg === "number"
              ? { weightKg: pet.weightKg, date: dateStr }
              : null
          );
        } catch {
          setCurrent(null);
        }
      } else {
        // Backend nuevo: { current, historics }
        setCurrent(data?.current ?? null);
        setRows(Array.isArray(data?.historics) ? data.historics : []);
      }
    } catch (e: any) {
      setErr(e?.message || "No se pudo cargar pesos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Si la ruta todavía no resolvió params, esperamos al siguiente render
    if (!petId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!petId) return;

    const dateEl = document.getElementById("w_date") as HTMLInputElement;
    const kgEl = document.getElementById("w_kg") as HTMLInputElement;

    const date = dateEl.value || new Date().toISOString().slice(0, 10); // hoy por defecto
    const weightKgStr = kgEl.value;

    if (!weightKgStr) {
      alert("El peso es requerido");
      return;
    }

    const weightKg = Number(weightKgStr);
    if (Number.isNaN(weightKg) || weightKg <= 0) {
      alert("Ingresa un peso válido");
      return;
    }

    setSaving(true);
    try {
      await api.post(`/api/pets/${petId}/clinical/weights`, {
        date,
        weightKg,
      });
      await load();
      kgEl.value = "";
    } catch (e: any) {
      alert(e?.message || "No se pudo agregar el peso");
    } finally {
      setSaving(false);
    }
  }

  async function del(id: string) {
    if (!petId) return;
    if (!confirm("¿Eliminar este registro histórico?")) return;

    setDeletingId(id);
    try {
      await api.delete(`/api/pets/${petId}/clinical/weights/${id}`);
      await load();
    } catch (e: any) {
      alert(e?.message || "No se pudo eliminar");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Historial de pesos</h1>
        <Link href={`/app/pets/${petId ?? ""}/clinical`} className="text-sm text-blue-600 hover:underline">
          ← Volver a clínico
        </Link>
      </div>

      {!petId && (
        <Card>
          <div className="p-4 text-sm text-slate-600">
            No se encontró el identificador de la mascota en la URL.
            Verifica que la ruta use <code>[petId]</code> o ajusta la lectura del parámetro.
          </div>
        </Card>
      )}

      <Card>
        <div className="p-4">
          <p className="text-sm text-slate-600">
            Registra pesos y revisa el histórico abajo.
          </p>
        </div>
      </Card>

      {current && current.weightKg != null && (
        <Card>
          <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Peso actual</h2>
              <p className="text-sm text-slate-500">
                {current.date ? `Medido el ${toYmdLocal(current.date)}` : "Sin fecha registrada"}
              </p>
            </div>
            <div className="text-2xl font-bold">
              {Number(current.weightKg).toFixed(1)} kg
            </div>
          </div>
        </Card>
      )}

      <Card>
        <form onSubmit={add} className="p-4 grid sm:grid-cols-3 gap-3">
          <Field label="Fecha">
            <Input id="w_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          </Field>
          <Field label="Peso (kg)">
            <Input id="w_kg" type="number" step="0.1" min="0" placeholder="12.5" />
          </Field>
          <div className="flex items-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Agregando…" : "Agregar"}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="p-4">
          {loading ? (
            <p>Cargando…</p>
          ) : err ? (
            <p className="text-red-600">{err}</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-slate-500">Sin registros.</p>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-left text-sm">
                    <th className="border-b p-3">Fecha</th>
                    <th className="border-b p-3">Peso (kg)</th>
                    <th className="border-b p-3 w-0"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-b-0">
                      <td className="p-3">{toYmdLocal(r.date)}</td>
                      <td className="p-3">{Number(r.weightKg).toFixed(1)}</td>
                      <td className="p-3 text-right">
                        <Button
                          className="px-3 py-1.5 rounded-xl text-white bg-[--nh-danger] hover:brightness-95"
                          onClick={() => del(r.id)}
                          disabled={deletingId === r.id}
                        >
                          {deletingId === r.id ? "Eliminando…" : "Eliminar"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
