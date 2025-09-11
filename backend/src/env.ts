import 'dotenv/config';

export const env = {
  PORT: Number(process.env.PORT ?? 4000),
  DATABASE_URL: process.env.DATABASE_URL ?? 'file:./dev.db',
  JWT_SECRET: process.env.JWT_SECRET ?? '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? ''
};

if (!env.JWT_SECRET) throw new Error('Falta JWT_SECRET en .env');
