// src/scripts/fill-geo-missing.ts
// Asigna comuna/ciudad/región a usuarios sin datos geográficos para el gráfico "Top 10 comunas".
import { prisma } from '../services/prisma.ts';

const COMUNAS = [
  'Santiago','Maipú','Puente Alto','La Florida','Ñuñoa','Providencia','Las Condes','Vitacura','La Reina',
  'Peñalolén','Macul','San Miguel','Independencia','Recoleta','Quilicura','Renca','Huechuraba','Conchalí',
  'Lo Barnechea','Cerro Navia','Lo Prado','Quinta Normal','Estación Central','La Granja','San Joaquín',
  'San Ramón','La Cisterna','Pedro Aguirre Cerda','El Bosque','Pudahuel','Lo Espejo','Cerrillos'
];

function pick<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }

(async () => {
  const missing = await prisma.user.findMany({
    where: { OR: [{ commune: null }, { commune: '' }] },
    select: { id: true }
  });

  for (const u of missing) {
    await prisma.user.update({
      where: { id: u.id },
      data: { region: 'Metropolitana', city: 'Santiago', commune: pick(COMUNAS) }
    });
  }

  console.log(`Actualizados ${missing.length} usuarios sin comuna`);
  await prisma.$disconnect();
  process.exit(0);
})().catch(async (e) => {
  console.error('Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
