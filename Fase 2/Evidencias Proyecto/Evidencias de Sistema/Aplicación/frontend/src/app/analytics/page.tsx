"use client";

/**
 * /analytics — Dashboard ejecutivo NutriHuella
 * - KPIs superiores (incluye % PLUS y % BASIC)
 * - Serie de altas por mes (con filtro de año)
 * - Top comunas
 * - Distribución por especie
 * - Top productos en despensa
 * - Recetas generadas vs guardadas por tipo
 * - Top tenencia PLUS
 * - Heatmap 7x24 (con filtro de mes)
 */

import { useEffect, useMemo, useState } from "react";
import RoleGate from "@/components/RoleGate";
import KPICard from "@/components/KPICard";
import { AnalyticsAPI, type HeatCell } from "@/lib/analytics";

import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Paleta NutriHuella
const COLORS = {
  primary: "#10b981",
  primaryDark: "#059669",
  accent: "#f59e0b",
  accentDark: "#d97706",
  slate: "#64748b",
  gray: "#94a3b8",
  blue: "#3b82f6",
  purple: "#8b5cf6",
};
const SERIES = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#64748b"];

export default function AnalyticsPage() {
  return (
    <RoleGate requireAnalyst>
      <div className="space-y-6">
        <Header />
        <SummarySection />
        <SeriesSection />
        <DistributionSection />
        <BehaviorSection />
        <PlusTenureSection />
      </div>
    </RoleGate>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analítica de Negocio</h1>
        <p className="text-gray-600">Visión ejecutiva del uso de la plataforma y preferencias alimentarias.</p>
      </div>
    </div>
  );
}

function SummarySection() {
  const [s, setS] = useState<any>(null);
  useEffect(() => {
    (async () => setS(await AnalyticsAPI.summary()))();
  }, []);

  const totals = s?.totals || {};
  const kpis = s?.kpis || {};
  const plusPct = +(kpis.plusSharePct ?? 0).toFixed(1);
  const basicPct = +(kpis.basicSharePct ?? (100 - plusPct)).toFixed(1);

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <KPICard label="Usuarios totales" value={totals.users ?? "…"} />
      <KPICard label="Activos 7/30/90" value={`${totals.active7 ?? 0}/${totals.active30 ?? 0}/${totals.active90 ?? 0}`} />
      <KPICard label="% PLUS" value={`${plusPct}%`} />
      <KPICard label="% BASIC" value={`${basicPct}%`} />
      <KPICard label="Mascotas (Perros/Gatos)" value={`${totals.pets ?? 0} (${totals.dogs ?? 0}/${totals.cats ?? 0})`} />
    </section>
  );
}

function SeriesSection() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(thisYear);
  const [rows, setRows] = useState<Array<{ month: string; users: number }>>([]);

  useEffect(() => {
    (async () => setRows(await AnalyticsAPI.usersByMonth(year)))();
  }, [year]);

  const years = useMemo(() => [thisYear], [thisYear]); // si luego hay más años, se agregan aquí

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Usuarios registrados por mes</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Año</span>
          <select
            className="rounded-md border px-2 py-1 text-sm"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="users" name="Usuarios" stroke={COLORS.primaryDark} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function DistributionSection() {
  const [geo, setGeo] = useState<Array<{ label: string; count: number; type: string }>>([]);
  const [species, setSpecies] = useState<Array<{ species: string; count: number }>>([]);

  useEffect(() => {
    (async () => {
      setGeo(await AnalyticsAPI.geography());
      setSpecies(await AnalyticsAPI.species());
    })();
  }, []);

  const topCommune = useMemo(
    () => geo.filter((g) => g.type === "commune").slice(0, 12).map((g) => ({ commune: g.label, value: g.count })),
    [geo]
  );

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Top comunas por usuarios</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topCommune}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="commune" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Usuarios" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Distribución por especie</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={species} dataKey="count" nameKey="species" outerRadius={"80%"} label>
                {species.map((_, i) => (
                  <Cell key={i} fill={SERIES[i % SERIES.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

function BehaviorSection() {
  const [pantry, setPantry] = useState<Array<{ label: string; value: number }>>([]);
  const [byType, setByType] = useState<Array<{ planType: string; generated: number; saved: number }>>([]);
  const [heat, setHeat] = useState<HeatCell[]>([]);
  const [month, setMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    (async () => {
      setPantry(await AnalyticsAPI.pantryTop());
      setByType(await AnalyticsAPI.recipesByType());
    })();
  }, []);

  useEffect(() => {
    (async () => setHeat(await AnalyticsAPI.hoursHeatmap(month)))();
  }, [month]);

  const typeLabel = (t: string) =>
    (
      {
        BREAKFAST: "Desayunos",
        LUNCH: "Almuerzos",
        DINNER: "Cenas",
        DAILY: "Planes diarios",
        WEEKLY: "Planes semanales",
      } as any
    )[t] ?? t;

  const byTypeRows = byType.map((r) => ({ label: typeLabel(r.planType), generated: r.generated, saved: r.saved }));

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Top productos en despensa</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pantry.slice(0, 12)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Ocurrencias" fill={COLORS.accent} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-1">
        <h2 className="text-lg font-semibold mb-3">Recetas generadas vs guardadas por tipo</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byTypeRows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="generated" name="Generadas" fill={COLORS.primary} />
              <Bar dataKey="saved" name="Guardadas" fill={COLORS.blue} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Actividad por hora y día</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Mes</span>
            <input
              type="month"
              className="rounded-md border px-2 py-1 text-sm"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
        </div>
        <Heatmap hours={heat} />
      </div>
    </section>
  );
}

function PlusTenureSection() {
  const [rows, setRows] = useState<Array<{ userId: string; name: string; email: string; days: number; since: string }>>([]);
  useEffect(() => {
    (async () => setRows(await AnalyticsAPI.plusTopTenure()))();
  }, []);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-3">Top usuarios por antigüedad en PLUS</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2">Usuario</th>
              <th className="py-2">Email</th>
              <th className="py-2">Días</th>
              <th className="py-2">Desde</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.userId} className="border-t">
                <td className="py-2">{r.name || r.email}</td>
                <td className="py-2">{r.email}</td>
                <td className="py-2">{r.days}</td>
                <td className="py-2">{r.since}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// Heatmap 7x24
function Heatmap({ hours }: { hours: HeatCell[] }) {
  const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));
  let max = 1;
  for (const c of hours || []) {
    matrix[c.day][c.hour] = c.value;
    if (c.value > max) max = c.value;
  }
  const days = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr>
            <th className="p-1 text-left">Día/Hora</th>
            {Array.from({ length: 24 }, (_, h) => (
              <th key={h} className="p-1 text-center">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, d) => (
            <tr key={d}>
              <td className="p-1 font-medium">{days[d]}</td>
              {row.map((v, h) => {
                const intensity = v === 0 ? 0 : v / max;
                const bg =
                  intensity === 0
                    ? "bg-gray-50"
                    : intensity < 0.25
                    ? "bg-emerald-100"
                    : intensity < 0.5
                    ? "bg-emerald-200"
                    : intensity < 0.75
                    ? "bg-emerald-300"
                    : "bg-emerald-400";
                return (
                  <td key={h} className="p-0.5">
                    <div className={`h-5 w-6 ${bg} rounded`} title={`Día ${days[d]} ${h}:00 = ${v}`} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
