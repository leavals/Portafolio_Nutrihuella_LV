// Prisma singleton (ESM + NodeNext)
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __PRISMA__: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__PRISMA__ ?? new PrismaClient({ log: ['warn', 'error'] });

if (process.env.NODE_ENV !== 'production') global.__PRISMA__ = prisma;

export default prisma;
