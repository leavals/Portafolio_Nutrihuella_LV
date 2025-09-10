// Carga variables de entorno desde backend/.env
import 'dotenv/config';

export const env = {
  PORT: process.env.PORT ?? '3000',
  DATABASE_URL: process.env.DATABASE_URL ?? 'file:./dev.db', // respaldo
  JWT_SECRET: process.env.JWT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID, // puede estar vacío al inicio
};

// Validación mínima: sin JWT no iniciamos
if (!env.JWT_SECRET) {
  throw new Error('Falta JWT_SECRET en .env');
}
