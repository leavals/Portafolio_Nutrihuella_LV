// backend/src/app.ts
import express from 'express';
import cors, { type CorsOptions } from 'cors';
import path from 'node:path';
import authRoutes from './routes/auth.routes.js';
import petRoutes  from './routes/pets.routes.js';

const app = express();

const corsOptions: CorsOptions = {
  origin: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Servir archivos subidos (fotos de mascotas)
app.use('/uploads', express.static(path.resolve('uploads')));

app.get('/', (_req, res) => res.send('NutriHuella API 🚀'));
app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);

export default app;
