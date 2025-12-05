"use client";

/**
 * /analytics — Dashboard ejecutivo NutriHuella
 * Gráficos “que hablan solos”, con estados vacíos y fallbacks.
 *
 * Secciones:
 *  - Header + SummarySection (KPIs rápidos)
 *  - GrowthSection: Altas vs PLUS por mes (fallback automático al año previo)
 *  - DAUSection: Usuarios activos diarios (últimos 7–90 días)
 *  - RevenueSection: Ingresos por mes + ARPU (fallback al año previo)
 *  - FunnelSection: Embudo de activación (30–120 días)
 *  - RecipesSection: Generadas vs Guardadas por tipo de plan/receta  ← (OCULTA EN LAYOUT)
 *  - DevicesSection: Uso por dispositivo (30–120 días)
 *  - GeographySection: Top 10 comunas (maneja 404/NotFound sin romper UI)
 */

import { useEffect, useMemo, useState } from "react";
import RoleGate from "@/components/RoleGate";
import KPICard from "@/components/KPICard";
import { AnalyticsAPI } from "@/lib/analytics";

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
  ComposedChart,
  LabelList,
} from "recharts";

// ===============================
// Paleta / Formatos
// ===============================
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

const fmtCLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});
const fmtInt = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

// ===============================
// Página
// ===============================
export default function AnalyticsPage() {
  return (
    <RoleGate requireAnalyst>
      <div className="space-y-6">
        <Header />
        <SummarySection />
        <GrowthSection />
        <DAUSection />
        <RevenueSection />
        <FunnelSection />
        {/* <RecipesSection />  ← OCULTO intencionalmente por solicitud */}
        <DevicesSection />
        <GeographySection />
      </div>
    </RoleGate>
  );
}

// ===============================
// Header
// ===============================
function Header() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analítica de Negocio</h1>
        <p className="text-gray-600">Indicadores simples y directos con soporte de datos.</p>
      </div>
    </div>
  );
}

// ===============================
// KPIs — Resumen
// ===============================
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
      
      <KPICard label="% PLUS" value={`${plusPct}%`} />
      <KPICard label="% BASIC" value={`${basicPct}%`} />
      <KPICard
        label="Mascotas (Perros/Gatos)"
        value={`${totals.pets ?? 0} (${totals.dogs ?? 0}/${totals.cats ?? 0})`}
      />
    </section>
  );
}

// ============================================================================
// 1) CRECIMIENTO — Altas vs conversiones a PLUS por mes
// ============================================================================
function GrowthSection() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(thisYear);
  const [rows, setRows] = useState<Array<{ month: string; signups: number; plus: number }>>([]);
  const [triedFallback, setTriedFallback] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const data = await AnalyticsAPI.growthByMonth(year);
      setRows(data);
      const emptyNow = data.reduce((s, r) => s + (r.signups || 0) + (r.plus || 0), 0) === 0;
      if (emptyNow && !triedFallback && year === thisYear) {
        setTriedFallback(true);
        setYear(thisYear - 1);
      } else {
        setLoading(false);
      }
    })();
  }, [year, thisYear, triedFallback]);

  const totalSignups = rows.reduce((s, r) => s + (r.signups || 0), 0);
  const totalPlus = rows.reduce((s, r) => s + (r.plus || 0), 0);
  const convPct = totalSignups > 0 ? ((totalPlus / totalSignups) * 100).toFixed(1) : "0.0";

  const empty = totalSignups === 0 && totalPlus === 0;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-semibold">Altas vs conversiones a PLUS por mes</h2>
          <p className="text-xs text-gray-600">Conversión acumulada {convPct}% en {year}.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Año</span>
          <select
            className="rounded-md border px-2 py-1 text-sm"
            value={year}
            onChange={(e) => { setTriedFallback(true); setYear(Number(e.target.value)); setLoading(true); }}
          >
            {[thisYear, thisYear - 1].map((y) => (<option key={y} value={y}>{y}</option>))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-72 flex items-center justify-center text-gray-400 text-sm">Cargando…</div>
      ) : empty ? (
        <div className="h-72 flex items-center justify-center text-gray-500 text-sm">
          Sin datos para {year}. Ejecuta el boost de datos o selecciona otro año.
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v: any) => fmtInt.format(v)} />
              <Legend />
              <Bar dataKey="signups" name="Altas nuevas" fill={COLORS.primary} />
              <Bar dataKey="plus" name="Conversiones a PLUS" fill={COLORS.blue} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

// ============================================================================
// 2) DAU — Usuarios activos diarios (7–90 días)
// ============================================================================
function DAUSection() {
  const [days, setDays] = useState<number>(30);
  const [rows, setRows] = useState<Array<{ date: string; dau: number }>>([]);

  useEffect(() => { (async () => setRows(await AnalyticsAPI.activityDAU(days)))(); }, [days]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Usuarios activos diarios (DAU)</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Ventana</span>
          <select className="rounded-md border px-2 py-1 text-sm" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[7, 14, 30, 60, 90].map((d) => (<option key={d} value={d}>{d} días</option>))}
          </select>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(v: any) => fmtInt.format(v)} />
            <Legend />
            <Line type="monotone" dataKey="dau" name="DAU" stroke={COLORS.primaryDark} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

// ============================================================================
// 3) INGRESOS — Ingresos por mes + ARPU
// ============================================================================
function RevenueSection() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(thisYear);
  const [rows, setRows] = useState<Array<{ month: string; revenue: number; arpu: number }>>([]);
  const [triedFallback, setTriedFallback] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const data = await AnalyticsAPI.revenueByMonth(year);
      setRows(data);
      const emptyNow = data.reduce((s, r) => s + (r.revenue || 0), 0) === 0;
      if (emptyNow && !triedFallback && year === thisYear) {
        setTriedFallback(true);
        setYear(thisYear - 1);
      } else {
        setLoading(false);
      }
    })();
  }, [year, thisYear, triedFallback]);

  const sumRev = rows.reduce((s, r) => s + (r.revenue || 0), 0);
  const empty = sumRev === 0;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-semibold">Ingresos por mes y ARPU</h2>
          <p className="text-xs text-gray-600">Pagos aprobados (barras) y ARPU = ingresos / usuarios activos mensuales (línea).</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Año</span>
          <select
            className="rounded-md border px-2 py-1 text-sm"
            value={year}
            onChange={(e) => { setTriedFallback(true); setYear(Number(e.target.value)); setLoading(true); }}
          >
            {[thisYear, thisYear - 1].map((y) => (<option key={y} value={y}>{y}</option>))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-72 flex items-center justify-center text-gray-400 text-sm">Cargando…</div>
      ) : empty ? (
        <div className="h-72 flex items-center justify-center text-gray-500 text-sm">
          Sin datos de pagos aprobados/ARPU para {year}. Ejecuta el boost de pagos.
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(v: any) => fmtCLP.format(v)} />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" name="Ingresos" fill={COLORS.accent} />
              <Line yAxisId="right" type="monotone" dataKey="arpu" name="ARPU" stroke={COLORS.blue} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

// ============================================================================
// 4) EMBUDO — Activación (barras horizontales)
// ============================================================================
function FunnelSection() {
  const [days, setDays] = useState<number>(30);
  const [rows, setRows] = useState<Array<{ stage: string; count: number }>>([]);

  useEffect(() => { (async () => setRows(await AnalyticsAPI.activationFunnel(days)))(); }, [days]);

  const total = rows.reduce((s, r) => s + (r.count || 0), 0);
  const empty = total === 0;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Embudo de activación</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Ventana</span>
          <select className="rounded-md border px-2 py-1 text-sm" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[30, 60, 90, 120].map((d) => (<option key={d} value={d}>{d} días</option>))}
          </select>
        </div>
      </div>

      {empty ? (
        <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
          Sin eventos en {days} días. Ejecuta el boost de eventos.
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ top: 10, right: 20, bottom: 10, left: 160 }} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="stage" tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => fmtInt.format(v)} />
              <Legend />
              <Bar dataKey="count" name="Usuarios" fill={COLORS.primary}>
                <LabelList dataKey="count" position="right" formatter={(v: number) => fmtInt.format(v)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

// ============================================================================
// 5) RECETAS — Generadas vs Guardadas por tipo
// (el componente queda definido, pero NO se renderiza en el layout)
// ============================================================================
function RecipesSection() {
  const [rows, setRows] = useState<Array<{ planType: string; generated: number; saved: number }>>([]);

  useEffect(() => { (async () => setRows(await AnalyticsAPI.recipesByType()))(); }, []);

  const totals = rows.reduce(
    (acc, r) => {
      acc.generated += r.generated || 0;
      acc.saved += r.saved || 0;
      return acc;
    },
    { generated: 0, saved: 0 }
  );

  const empty = rows.length === 0 || totals.generated + totals.saved === 0;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-2">Recetas generadas vs guardadas por tipo</h2>

      {empty ? (
        <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
          Sin actividad de recetas. Genera o guarda recetas para ver datos.
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="planType" />
              <YAxis />
              <Tooltip formatter={(v: any) => fmtInt.format(v)} />
              <Legend />
              <Bar dataKey="generated" name="Generadas" fill={COLORS.blue}>
                <LabelList dataKey="generated" position="top" formatter={(v: number) => fmtInt.format(v)} />
              </Bar>
              <Bar dataKey="saved" name="Guardadas" fill={COLORS.accentDark}>
                <LabelList dataKey="saved" position="top" formatter={(v: number) => fmtInt.format(v)} />
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

// ============================================================================
// 6) DISPOSITIVOS — Uso por dispositivo (30–120 días)
// ============================================================================
function DevicesSection() {
  const [days, setDays] = useState<number>(120);
  const [rows, setRows] = useState<Array<{ device: string; count: number }>>([]);

  useEffect(() => { (async () => setRows(await AnalyticsAPI.devicesShare(days)))(); }, [days]);

  const total = rows.reduce((s, r) => s + (r.count || 0), 0);
  const empty = total === 0;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Uso por dispositivo</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Ventana</span>
          <select className="rounded-md border px-2 py-1 text-sm" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[30, 60, 90, 120].map((d) => (<option key={d} value={d}>{d} días</option>))}
          </select>
        </div>
      </div>

      {empty ? (
        <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
          Sin eventos por dispositivo en {days} días. Ejecuta el boost de eventos.
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rows}
                dataKey="count"
                nameKey="device"
                innerRadius="55%"
                outerRadius="80%"
                label={(e) => `${e.device}: ${total > 0 ? Math.round(((e.count || 0) / total) * 100) : 0}%`}
              >
                {rows.map((_, i) => (<Cell key={i} fill={SERIES[i % SERIES.length]} />))}
              </Pie>
              <Tooltip formatter={(v: any) => fmtInt.format(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

// ============================================================================
// 7) GEOGRAFÍA — Top 10 comunas por usuarios
// ============================================================================
function GeographySection() {
  const [geo, setGeo] = useState<Array<{ label: string; count: number; type: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await AnalyticsAPI.geography();
        setGeo(Array.isArray(data) ? data : []);
        setError(null);
      } catch {
        setGeo([]);
        setError("Sin datos de comunas. Crea usuarios o ejecuta el boost de datos.");
      }
    })();
  }, []);

  const topCommune = useMemo(
    () => geo.filter((g) => g.type === "commune").slice(0, 10).map((g) => ({ name: g.label, value: g.count })),
    [geo]
  );

  const empty = topCommune.length === 0;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-3">Top 10 comunas por usuarios</h2>

      {empty ? (
        <div className="h-80 flex items-center justify-center text-gray-500 text-sm">
          {error ?? "Sin datos de comunas. Crea usuarios o ejecuta el boost de datos."}
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topCommune} layout="vertical" margin={{ top: 10, right: 20, bottom: 10, left: 140 }} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => fmtInt.format(v)} />
              <Legend />
              <Bar dataKey="value" name="Usuarios" fill={COLORS.accent}>
                <LabelList dataKey="value" position="right" formatter={(v: number) => fmtInt.format(v)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
