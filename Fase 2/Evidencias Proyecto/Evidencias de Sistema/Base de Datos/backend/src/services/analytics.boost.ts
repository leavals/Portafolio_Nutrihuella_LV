// src/services/analytics.boost.ts
// ------------------------------------------------------------
// Genera datos de soporte para los gráficos del dashboard.
// - Usuarios por mes (BASIC/PLUS) en el año indicado.
// - Pagos AUTHORIZED por mes.
// - Eventos con distribución por dispositivo (últimos 120 días).
// ------------------------------------------------------------

import { prisma } from './prisma.ts';

export type BoostOptions = {
  year: number;
  users?: number;
  payments?: number;
  events?: number;
};

const COMUNAS = [
  'Santiago','Maipú','Puente Alto','La Florida','Ñuñoa','Providencia','Las Condes','Vitacura','La Reina',
  'Peñalolén','Macul','San Miguel','Independencia','Recoleta','Quilicura','Renca','Huechuraba','Conchalí',
  'Lo Barnechea','Cerro Navia','Lo Prado','Quinta Normal','Estación Central','La Granja','San Joaquín',
  'San Ramón','La Cisterna','Pedro Aguirre Cerda','El Bosque','Pudahuel','Lo Espejo','Cerrillos'
];

const AMOUNTS = [5990, 7990, 9990, 12990];

function pad2(n: number) { return String(n).padStart(2, '0'); }
function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick<T>(arr: T[]) { return arr[rand(0, arr.length - 1)]; }
function randomDateInMonth(year: number, month1to12: number) {
  const day = rand(1, 28);
  const h = rand(0, 23), m = rand(0, 59), s = rand(0, 59);
  return new Date(year, month1to12 - 1, day, h, m, s, 0);
}
function weightedDevice(): 'WEB'|'ANDROID'|'IOS' {
  const r = Math.random();
  if (r < 0.60) return 'WEB';
  if (r < 0.85) return 'ANDROID';
  return 'IOS';
}

export async function boostAnalyticsData(opts: BoostOptions) {
  const year = opts.year;
  const totalUsers = Math.max(120, opts.users ?? 150);
  const totalPayments = Math.max(120, opts.payments ?? 240);
  const totalEvents = Math.max(300, opts.events ?? 900);

  // 1) Usuarios por mes + posibles conversiones a PLUS
  const basePerMonth = Math.floor(totalUsers / 12);
  let residue = totalUsers - basePerMonth * 12;

  const createdUserIds: string[] = [];
  for (let m = 1; m <= 12; m++) {
    const target = basePerMonth + (residue-- > 0 ? 1 : 0);
    for (let i = 0; i < target; i++) {
      const createdAt = randomDateInMonth(year, m);
      const plus = Math.random() < 0.35;
      const email = `demo+${year}${pad2(m)}_${i}_${Math.random().toString(36).slice(2,6)}@demo.local`;

      const u = await prisma.user.create({
        data: {
          email,
          passwordHash: 'demo-hash',
          name: `Usuario Demo ${year}-${pad2(m)}-${i}`,
          role: 'USER',
          plan: plus ? 'PLUS' : 'BASIC',
          region: 'Metropolitana',
          city: 'Santiago',
          commune: pick(COMUNAS),
          emailVerifiedAt: new Date(),
          createdAt,
          membershipUpdatedAt: plus ? randomDateInMonth(year, m) : null
        },
        select: { id: true }
      });
      createdUserIds.push(u.id);
    }
  }

  const allUsers = await prisma.user.findMany({ select: { id: true } });
  const allUserIds = allUsers.map(u => u.id);

  // 2) Pagos AUTHORIZED por mes
  const basePayPerMonth = Math.floor(totalPayments / 12);
  let payResidue = totalPayments - basePayPerMonth * 12;
  for (let m = 1; m <= 12; m++) {
    const target = basePayPerMonth + (payResidue-- > 0 ? 1 : 0);
    for (let i = 0; i < target; i++) {
      await prisma.payment.create({
        data: {
          userId: pick(allUserIds),
          buyOrder: `BO-${year}${pad2(m)}-${Math.random().toString(36).slice(2,10)}`,
          sessionId: `SESS-${Math.random().toString(36).slice(2,10)}`,
          amount: pick(AMOUNTS),
          status: 'AUTHORIZED',
          raw: JSON.stringify({ demo: true }),
          createdAt: randomDateInMonth(year, m)
        }
      });
    }
  }

  // 3) Eventos con distribución de dispositivos (últimos 120 días)
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 119);
  for (let i = 0; i < totalEvents; i++) {
    const d = new Date(start.getTime() + Math.random() * (now.getTime() - start.getTime()));
    await prisma.analyticsEvent.create({
      data: {
        userId: pick(allUserIds),
        type: pick(['LOGIN','RECIPE_GENERATED','FAVORITE_ADDED','PANTRY_ADDED']),
        device: weightedDevice(),
        createdAt: d
      }
    });
  }

  return { year, inserted: { users: createdUserIds.length, payments: totalPayments, events: totalEvents } };
}
