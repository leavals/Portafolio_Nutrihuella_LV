// App Express: middlewares globales y montaje de rutas
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/', (_req, res) => res.send('NutriHuella API 🚀'));

export default app;
