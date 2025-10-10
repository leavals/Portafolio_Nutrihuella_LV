"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button, Card, Field, Input, Select } from "@/components/ui";

// ahora incluye "CRONIC"
type Row = { id: string; name: string; diagnosedAt: string; status: "ACTIVE" | "RESOLVED" | "CRONIC" };

const isoToYmd = (d: string) => new Date(d).toISOString().slice(0, 10);

export default function DiseasesPage() {
  const params = useParams<{ id: string }>();
  const petId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const router = useRouter();
  const sp = useSearchParams();
  const isWizard = sp.get("wizard") === "1";

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showNoDiseasesBtn, setShowNoDiseasesBtn] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    if (!petId) return;
    setLoading(true);
    setErr(null);

    try {
      const data = await api.get<Row[]>(`/api/pets/${petId}/clinical/diseases`);
      setRows(data);
      setShowNoDiseasesBtn(isWizard && data.length === 0);
    } catch (e: any) {
      setErr(e?.message || "No se pudo cargar");
      setShowNoDiseasesBtn(false);
    } finally {
      setEditingId(null);
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [petId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const name = (document.getElementById("d_name") as HTMLInputElement).value.trim();
    const date = (document.getElementById("d_date") as HTMLInputElement).value;
    const status = (document.getElementById("d_status") as HTMLSelectElement).value as Row["status"];
    if (!name || !date) return alert("Nombre y fecha requeridos");

    await api.post(`/api/pets/${petId}/clinical/diseases`, { name, diagnosedAt: date, status });

    (document.getElementById("d_name") as HTMLInputElement).value = "";
    (document.getElementById("d_date") as HTMLInputElement).value = "";
    (document.getElementById("d_status") as HTMLSelectElement).value = "ACTIVE";

    load();
  }

  async function save(row: Row) {
    await api.patch(`/api/pets/${petId}/clinical/diseases/${row.id}`, {
      diagnosedAt: row.diagnosedAt,
      status: row.status
    });
    setEditingId(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar enfermedad?")) return;
    await api.del(`/api/pets/${petId}/clinical/diseases/${id}`);
    setEditingId(null);
    load();
  }

  async function ackNoDiseases() {
    try {
      await api.post(`/api/pets/${petId}/diseases/no-diseases-ack`);
      router.push(`/pets/${petId}`);
    } catch (e: any) {
      alert(e?.message || "No se pudo registrar el ACK de 'sin enfermedades'");
    }
  }

  if (!petId) return <p className="text-sm text-slate-500">Ruta inválida.</p>;

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <Link href={`/pets/${petId}`}>
          <Button variant="primary" className="text-white">
            ← Volver
          </Button>
        </Link>
      </div>

      <Card>
        <div className="p-4">
          <h1 className="text-2xl font-semibold">Enfermedades</h1>
        </div>
      </Card>

      {showNoDiseasesBtn && (
        <div className="rounded-lg border p-3 bg-yellow-50 text-yellow-900 text-sm flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span>Paso 2 de 2 • Agrega enfermedades si tu mascota tiene, o confirma que no tiene.</span>
          <div className="flex gap-2">
            <Button onClick={ackNoDiseases} variant="outline">
              No tiene enfermedades
            </Button>
          </div>
        </div>
      )}

      <Card>
        <form onSubmit={add} className="grid sm:grid-cols-4 gap-3 items-end" noValidate>
          <Field label="Nombre">
            <Input id="d_name" placeholder="Dermatitis, Alergia, ..." />
          </Field>
          <Field label="Fecha diagnóstico">
            <Input id="d_date" type="date" />
          </Field>
          <Field label="Estado">
            <Select id="d_status" defaultValue="ACTIVE">
              <option value="ACTIVE">Activa</option>
              <option value="RESOLVED">Resuelta</option>
              <option value="CRONIC">Crónica</option>
            </Select>
          </Field>
          <div>
            <Button type="submit" variant="primary" className="w-full">
              Agregar
            </Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <p>Cargando…</p>
      ) : err ? (
        <p className="text-red-600">{err}</p>
      ) : (
        <div className="space-y-3">
          {rows.length === 0 && <p className="text-sm text-slate-500">Sin registros.</p>}

          {rows.map((r) => {
            const isEditing = editingId === r.id;

            return (
              <div
                key={r.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-3 bg-white"
              >
                <div className="flex-1 grid sm:grid-cols-3 gap-2">
                  {/* Nombre SIEMPRE BLOQUEADO */}
                  <Input value={r.name} readOnly disabled />

                  <Input
                    type="date"
                    value={isoToYmd(r.diagnosedAt)}
                    readOnly={!isEditing}
                    disabled={!isEditing}
                    onChange={(e) =>
                      isEditing &&
                      setRows(
                        rows.map((x) =>
                          x.id === r.id ? { ...x, diagnosedAt: e.target.value } : x
                        )
                      )
                    }
                  />

                  <Select
                    value={r.status}
                    disabled={!isEditing}
                    onChange={(e) =>
                      isEditing &&
                      setRows(
                        rows.map((x) =>
                          x.id === r.id
                            ? { ...x, status: e.target.value as Row["status"] }
                            : x
                        )
                      )
                    }
                  >
                    <option value="ACTIVE">Activa</option>
                    <option value="RESOLVED">Resuelta</option>
                    <option value="CRONIC">Crónica</option>
                  </Select>
                </div>

                <div className="flex gap-2 mt-2 sm:mt-0">
                  {!isEditing ? (
                    <Button onClick={() => setEditingId(r.id)} variant="outline">
                      Editar
                    </Button>
                  ) : (
                    <>
                      <Button onClick={() => save(r)} variant="primary">
                        Guardar
                      </Button>
                      <Button
                        onClick={() => remove(r.id)}
                        variant="outline"
                        className="text-white bg-red-600 border-red-600 hover:bg-red-700"
                      >
                        Eliminar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
