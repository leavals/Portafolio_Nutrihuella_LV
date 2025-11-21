// src/scripts/seed-device-events-year.ts
// Genera eventos AnalyticsEvent distribuidos durante ~365 días
// Uso: node --loader ts-node/esm src/scripts/seed-device-events-year.ts --days=365 --min=5 --max=20
// Por defecto: days=365, min=6, max=12

import { prisma } from "../services/prisma.ts";

function argNum(name: string, def: number) {
  const m = process.argv.find(a => a.startsWith(`--${name}=`));
  if (!m) return def;
  const v = Number(m.split("=")[1]);
  return Number.isFinite(v) ? v : def;
}

function pick<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }
function weightedDevice(): "WEB" | "ANDROID" | "IOS" {
  const r = Math.random();
  if (r < 0.60) return "WEB";
  if (r < 0.85) return "ANDROID";
  return "IOS";
}
function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function main() {
  const days = argNum("days", 365);
  const minPerDay = argNum("min", 6);
  const maxPerDay = argNum("max", 12);

  const users = await prisma.user.findMany({ select: { id: true } });
  if (users.length === 0) {
    console.log("No hay usuarios en la BD. Ejecuta primero los boosts de usuarios.");
    return;
  }
  const userIds = users.map(u => u.id);

  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - (days - 1)); // incluye hoy

  let total = 0;
  for (let i = 0; i < days; i++) {
    const base = new Date(start);
    base.setDate(start.getDate() + i);

    const n = rand(minPerDay, maxPerDay);
    for (let k = 0; k < n; k++) {
      const d = new Date(base);
      d.setHours(rand(0, 23), rand(0, 59), rand(0, 59), 0);
      await prisma.analyticsEvent.create({
        data: {
          userId: pick(userIds),
          type: pick(["LOGIN", "RECIPE_GENERATED", "FAVORITE_ADDED", "PANTRY_ADDED"]),
          device: weightedDevice(),
          createdAt: d,
        },
      });
      total++;
    }
  }
  console.log(`Eventos creados: ${total} en ${days} días.`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
