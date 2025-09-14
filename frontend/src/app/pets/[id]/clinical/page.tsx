"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button, Card, Field, Input } from "@/components/ui";

type Clinical = {
  allergies?: string[];           // CSV en UI
  chronicConditions?: string[];   // CSV en UI
  medications?: string[];
  surgeries?: string[];
  lastVetVisit?: string | null;   // ISO
  lastDeworming?: string | null;  // ISO
  lastFleaTick?: string | null;   // ISO
  bloodType?: string | null;
  vetClinic?: string | null;
  vetPhone?: string | null;
  notes?: string | null;
};

const toCSV = (a?: string[]) => (a && a.length ? a.join(", ") : "");
const toArr = (s: string) => s.split(",").map(v => v.trim()).filter(Boolean);
const toISO = (s: string) => (s ? new Date(s).toISOString() : null);
const fromISOyyyyMMdd = (iso?: string | null) =>
  iso ? new Date(iso).toISOString().slice(0, 10) : "";

export default function ClinicalPage() {
  const params = useParams<{ id: string }>();
  const petId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [form, setForm] = useState<Clinical | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!petId) return;
    (async () => {
      setLoading(true);
      setMsg(null); setErr(null);
      try {
        const data = await api.get<Clinical | null>(`/api/pets/${petId}/clinical`);
        setForm(data ?? {
          allergies: [], chronicConditions: [], medications: [], surgeries: [],
          lastVetVisit: null, lastDeworming: null, lastFleaTick: null,
          bloodType: null, vetClinic: null, vetPhone: null, notes: null,
        });
      } catch (e: any) {
        setErr(e?.message || "No se pudo cargar la ficha clínica");
      } finally {
        setLoading(false);
      }
    })();
  }, [petId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!petId || !form) return;
    setMsg(null); setErr(null);
    try {
      await api.put(`/api/pets/${petId}/clinical`, {
        allergies:         toArr((document.getElementById("f_allergies") as HTMLInputElement).value),
        chronicConditions: toArr((document.getElementById("f_chronic") as HTMLInputElement).value),
        medications:       toArr((document.getElementById("f_meds") as HTMLInputElement).value),
        surgeries:         toArr((document.getElementById("f_surg") as HTMLInputElement).value),
        lastVetVisit:      toISO((document.getElementById("f_lastvet") as HTMLInputElement).value),
        lastDeworming:     toISO((document.getElementById("f_deworm") as HTMLInputElement).value),
        lastFleaTick:      toISO((document.getElementById("f_flea") as HTMLInputElement).value),
        bloodType:         (document.getElementById("f_blood") as HTMLInputElement).value || null,
        vetClinic:         (document.getElementById("f_clinic") as HTMLInputElement).value || null,
        vetPhone:          (document.getElementById("f_phone") as HTMLInputElement).value || null,
        notes:             (document.getElementById("f_notes") as HTMLTextAreaElement).value || null,
      });
      setMsg("Ficha clínica guardada correctamente.");
    } catch (e: any) {
      setErr(e?.message || "No se pudo guardar");
    }
  }

  if (!petId) return <p className="text-sm text-slate-500">Ruta inválida.</p>;
  if (loading || !form) return <p className="text-sm text-slate-500">Cargando…</p>;

  return (
    <div className="space-y-4">
      <Link href={`/pets/${petId}`} className="text-sm underline">← Volver</Link>
      <h1 className="text-2xl font-semibold">Ficha clínica</h1>

      <Card>
        <form onSubmit={save} className="grid md:grid-cols-2 gap-4" noValidate>
          <Field label="Alergias (CSV)">
            <Input id="f_allergies" defaultValue={toCSV(form.allergies)} placeholder="polen, césped" />
          </Field>
          <Field label="Condiciones crónicas (CSV)">
            <Input id="f_chronic" defaultValue={toCSV(form.chronicConditions)} placeholder="diabetes" />
          </Field>
          <Field label="Medicamentos (CSV)">
            <Input id="f_meds" defaultValue={toCSV(form.medications)} placeholder="ibuprofeno 50mg" />
          </Field>
          <Field label="Cirugías (CSV)">
            <Input id="f_surg" defaultValue={toCSV(form.surgeries)} placeholder="esterilización" />
          </Field>

          <Field label="Última visita vet.">
            <Input id="f_lastvet" type="date" defaultValue={fromISOyyyyMMdd(form.lastVetVisit ?? null)} />
          </Field>
          <Field label="Última desparasitación">
            <Input id="f_deworm" type="date" defaultValue={fromISOyyyyMMdd(form.lastDeworming ?? null)} />
          </Field>
          <Field label="Última pulgas/garrapatas">
            <Input id="f_flea" type="date" defaultValue={fromISOyyyyMMdd(form.lastFleaTick ?? null)} />
          </Field>
          <Field label="Tipo de sangre">
            <Input id="f_blood" defaultValue={form.bloodType ?? ""} placeholder="Desconocido" />
          </Field>

          <Field label="Clínica">
            <Input id="f_clinic" defaultValue={form.vetClinic ?? ""} />
          </Field>
          <Field label="Fono vet.">
            <Input id="f_phone" defaultValue={form.vetPhone ?? ""} />
          </Field>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Notas</label>
            <textarea id="f_notes" defaultValue={form.notes ?? ""} className="input w-full h-24" />
          </div>

          {msg && <div className="md:col-span-2 text-sm text-green-700" aria-live="polite">{msg}</div>}
          {err && <div className="md:col-span-2 text-sm text-red-600" aria-live="polite">{err}</div>}

          <div className="md:col-span-2">
            <Button type="submit">Guardar clínica</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
