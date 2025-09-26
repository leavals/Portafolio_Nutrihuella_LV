"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui";

type Item = {
  id: string;
  name: string;
  quantity?: number | null;
  unit?: string | null;
  category?: string | null;
  expiresAt?: string | null;
  preferred?: boolean;
};

type Payload = {
  pet: { id: string; name: string };
  counts: { aptos: number; prohibidos: number };
  aptos: Item[];
  prohibidos: Item[];
};

export default function PetPantryPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async ()=>{
      setLoading(true);
      const payload = await api.get<Payload>(`/api/pets/${id}/pantry-usable`);
      setData(payload);
      setLoading(false);
    })();
  }, [id]);

  if (!id) return <p>Ruta inválida.</p>;
  if (loading) return <p>Cargando…</p>;
  if (!data) return <p>Sin datos.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Despensa para {data.pet.name}</h1>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h2 className="text-lg font-semibold mb-2">Aptos ({data.counts.aptos})</h2>
          <ul className="space-y-2">
            {data.aptos.map(i=>(
              <li key={i.id} className="border rounded-lg p-3 bg-white flex items-center justify-between">
                <div>
                  <div className="font-medium">{i.name}</div>
                  <div className="text-sm text-slate-500">{i.category ?? "OTROS"} • {i.quantity ?? "—"} {i.unit ?? ""}</div>
                  {i.expiresAt && <div className="text-xs text-slate-400">Caduca: {new Date(i.expiresAt).toLocaleDateString()}</div>}
                </div>
                {i.preferred ? <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Preferido</span> : null}
              </li>
            ))}
            {data.aptos.length === 0 && <li className="text-sm text-slate-500">No hay aptos según la ficha nutricional.</li>}
          </ul>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-2">Prohibidos / Evitar ({data.counts.prohibidos})</h2>
          <ul className="space-y-2">
            {data.prohibidos.map(i=>(
              <li key={i.id} className="border rounded-lg p-3 bg-white">
                <div className="font-medium">{i.name}</div>
                <div className="text-sm text-slate-500">{i.category ?? "OTROS"}</div>
              </li>
            ))}
            {data.prohibidos.length === 0 && <li className="text-sm text-slate-500">¡Excelente! No hay prohibidos detectados.</li>}
          </ul>
        </Card>
      </div>

      <Card>
        <p className="text-sm text-slate-500">
          Esta vista es de solo lectura. Para gestionar inventario ve a <a className="underline" href="/pantry">/pantry</a>.
          En el Sprint 4, la IA usará “Aptos” + ficha nutricional para crear planes personalizados.
        </p>
      </Card>
    </div>
  );
}
