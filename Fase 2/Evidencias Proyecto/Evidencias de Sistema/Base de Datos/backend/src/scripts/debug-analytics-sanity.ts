// src/scripts/debug-analytics-sanity.ts
import { prisma } from "../services/prisma.ts";

const unixSec = (col: string) =>
  `CASE WHEN typeof(${col})='integer' THEN ${col}/1000 ELSE strftime('%s', ${col}) END`;
const unixMs = (col: string) =>
  `CASE WHEN typeof(${col})='integer' THEN ${col} ELSE CAST(strftime('%s', ${col}) AS INTEGER)*1000 END`;

async function tableRange() {
  const [u, p, e] = await Promise.all([
    prisma.$queryRawUnsafe<any[]>(`SELECT MIN(${unixMs("createdAt")}) AS min, MAX(${unixMs("createdAt")}) AS max, COUNT(*) AS c FROM User`),
    prisma.$queryRawUnsafe<any[]>(`SELECT MIN(${unixMs("createdAt")}) AS min, MAX(${unixMs("createdAt")}) AS max, COUNT(*) AS c FROM Payment`),
    prisma.$queryRawUnsafe<any[]>(`SELECT MIN(${unixMs("createdAt")}) AS min, MAX(${unixMs("createdAt")}) AS max, COUNT(*) AS c FROM AnalyticsEvent`),
  ]);
  console.table([
    { table: "User", ...u[0] },
    { table: "Payment", ...p[0] },
    { table: "AnalyticsEvent", ...e[0] },
  ]);
}

async function countsByYear(year: number) {
  const startMs = Date.UTC(year, 0, 1);
  const endMs = Date.UTC(year + 1, 0, 1);

  const users = await prisma.$queryRawUnsafe<any[]>(`
    SELECT strftime('%Y-%m', datetime(${unixSec("createdAt")}, 'unixepoch')) AS ym, COUNT(*) AS cnt
    FROM User
    WHERE ${unixMs("createdAt")} >= ${startMs} AND ${unixMs("createdAt")} < ${endMs}
    GROUP BY ym ORDER BY ym
  `);

  const plus = await prisma.$queryRawUnsafe<any[]>(`
    SELECT strftime('%Y-%m', datetime(${unixSec("membershipUpdatedAt")}, 'unixepoch')) AS ym, COUNT(*) AS cnt
    FROM User
    WHERE plan='PLUS' AND membershipUpdatedAt IS NOT NULL
      AND ${unixMs("membershipUpdatedAt")} >= ${startMs} AND ${unixMs("membershipUpdatedAt")} < ${endMs}
    GROUP BY ym ORDER BY ym
  `);

  const revenue = await prisma.$queryRawUnsafe<any[]>(`
    SELECT strftime('%Y-%m', datetime(${unixSec("createdAt")}, 'unixepoch')) AS ym, SUM(amount) AS amount
    FROM Payment
    WHERE status='AUTHORIZED'
      AND ${unixMs("createdAt")} >= ${startMs} AND ${unixMs("createdAt")} < ${endMs}
    GROUP BY ym ORDER BY ym
  `);

  return { users, plus, revenue };
}

async function devices(days: number) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));
  const startMs = start.getTime();
  const endMs = end.getTime();

  const rows = await prisma.$queryRawUnsafe<any[]>(`
    SELECT COALESCE(NULLIF(device,''),'UNKNOWN') AS device, COUNT(*) AS cnt
    FROM AnalyticsEvent
    WHERE ${unixMs("createdAt")} BETWEEN ${startMs} AND ${endMs}
    GROUP BY device ORDER BY cnt DESC
  `);
  return rows;
}

async function main() {
  console.log("\n=== Rango general (min/max) ===");
  await tableRange();

  for (const y of [2024, 2025]) {
    console.log(`\n=== USERS ${y} ===`);   console.log(await countsByYear(y).then(r => r.users));
    console.log(`\n=== PLUS ${y} ===`);    console.log(await countsByYear(y).then(r => r.plus));
    console.log(`\n=== REVENUE ${y} ===`); console.log(await countsByYear(y).then(r => r.revenue));
  }

  console.log("\n=== DEVICES last 30/60/90/120 ===");
  for (const d of [30, 60, 90, 120]) console.log(d, await devices(d));

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
