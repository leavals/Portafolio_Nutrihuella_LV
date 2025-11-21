/**
 * prisma/seed_boost_analytics.ts — Refuerzo de datos de analítica
 * Inserta datos adicionales para que los gráficos muestren información:
 *  - Conversiones a PLUS (actualiza plan y membershipUpdatedAt)
 *  - Pagos AUTHORIZED por mes (para ingresos y ARPU)
 *  - Eventos por dispositivo (para distribución por dispositivo)
 *
 * Ejecución:
 *   npx tsx prisma/seed_boost_analytics.ts --year=2025 --plus=90 --payments=150 --events=600
 *
 * Parámetros:
 *   --year       Año objetivo (por defecto: año actual)
 *   --plus       Nº de conversiones a PLUS a repartir (por defecto 90)
 *   --payments   Nº de pagos AUTHORIZED (por defecto 150)
 *   --events     Nº de eventos de dispositivo (por defecto 600)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Args = { [k: string]: string };
function args(): Args {
  const out: Args = {};
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.+)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}
function pad2(n: number) { return String(n).padStart(2, "0"); }
function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick<T>(arr: T[]) { return arr[rand(0, arr.length - 1)]; }

function randomDateBetween(a: Date, b: Date) {
  const t = a.getTime() + Math.random() * (b.getTime() - a.getTime());
  return new Date(t);
}

async function main() {
  const a = args();
  const YEAR = Number(a.year || new Date().getFullYear());
  const PLUS_TARGET = Number(a.plus || 90);
  const PAY_TARGET  = Number(a.payments || 150);
  const EVT_TARGET  = Number(a.events || 600);

  // Meses del año
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const monthRange = (m: number) => {
    const start = new Date(YEAR, m - 1, 1, 0, 0, 0);
    const end   = new Date(YEAR, m, 0, 23, 59, 59);
    return { start, end };
  };

  // Usuarios disponibles (no especiales)
  const special = ["admin@nutrihuella.cl", "analyst@nutrihuella.cl"];
  const users = await prisma.user.findMany({
    where: { email: { notIn: special } },
    select: { id: true, createdAt: true, plan: true, membershipUpdatedAt: true },
  });
  if (users.length === 0) {
    console.log("No hay usuarios regulares. Ejecuta primero el seed principal.");
    return;
  }

  // ---------- Conversiones a PLUS ----------
  // Toma un subconjunto y los pasa a PLUS con membershipUpdatedAt distribuido por meses.
  {
    const candidates = users.slice(); // copia
    const n = Math.min(PLUS_TARGET, candidates.length);
    for (let i = 0; i < n; i++) {
      const u = candidates.splice(rand(0, candidates.length - 1), 1)[0];
      const m = pick(months);
      const { start, end } = monthRange(m);
      const since = randomDateBetween(start, end);
      await prisma.user.update({
        where: { id: u.id },
        data: {
          plan: "PLUS",
          membershipUpdatedAt: since,
        },
      });
    }
    console.log(`✓ Conversiones a PLUS aplicadas: ${n}`);
  }

  // ---------- Pagos AUTHORIZED ----------
  // Inserta pagos con montos realistas y usuarios aleatorios, distribuidos en meses.
  {
    const amounts = [5990, 7990, 9990, 12990];
    for (let i = 0; i < PAY_TARGET; i++) {
      const u = pick(users);
      const m = pick(months);
      const { start, end } = monthRange(m);
      const when = randomDateBetween(start, end);
      await prisma.payment.create({
        data: {
          userId: u.id,
          buyOrder: `BO-${YEAR}${pad2(m)}-${Math.random().toString(36).slice(2, 8)}`,
          sessionId: `SESS-${Math.random().toString(36).slice(2, 10)}`,
          amount: pick(amounts),
          status: "AUTHORIZED",
          raw: JSON.stringify({ boost: true }),
          createdAt: when,
        },
      });
    }
    console.log(`✓ Pagos AUTHORIZED insertados: ${PAY_TARGET}`);
  }

  // ---------- Eventos por dispositivo ----------
  // Inserta eventos LOGIN con devices WEB/ANDROID/IOS ponderados.
  {
    const devices = [
      { d: "WEB", w: 6 },
      { d: "ANDROID", w: 3 },
      { d: "IOS", w: 2 },
    ];
    const totalW = devices.reduce((s, x) => s + x.w, 0);
    function pickDevice() {
      let r = Math.random() * totalW;
      for (const x of devices) { r -= x.w; if (r <= 0) return x.d; }
      return "WEB";
    }

    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 119); // ~120 días

    for (let i = 0; i < EVT_TARGET; i++) {
      const u = pick(users);
      const when = randomDateBetween(start, end);
      await prisma.analyticsEvent.create({
        data: {
          userId: u.id,
          type: "LOGIN",
          device: pickDevice(),
          createdAt: when,
        },
      });
    }
    console.log(`✓ Eventos de dispositivo insertados: ${EVT_TARGET}`);
  }

  console.log("✓ Boost de analítica finalizado.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
