// src/scripts/boost-analytics-data.ts
// Ejecutar con:
//   npm run boost:2024
// o personalizado:
//   node --loader ts-node/esm ./src/scripts/boost-analytics-data.ts --year=2024 --users=180 --payments=360 --events=1200

import { boostAnalyticsData } from '../services/analytics.boost.ts';
import { prisma } from '../services/prisma.ts';

function getArg(name: string, def?: number) {
  const a = process.argv.find(x => x.startsWith(`--${name}=`));
  if (!a) return def;
  const v = Number(a.split('=')[1]);
  return Number.isFinite(v) ? v : def;
}

(async () => {
  const year = getArg('year', new Date().getFullYear())!;
  const users = getArg('users');
  const payments = getArg('payments');
  const events = getArg('events');

  const out = await boostAnalyticsData({ year, users, payments, events });
  console.log('Boost finalizado:', out);
  await prisma.$disconnect();
  process.exit(0);
})().catch(async (e) => {
  console.error('Error en boost:', e);
  await prisma.$disconnect();
  process.exit(1);
});
