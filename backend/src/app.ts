// App Express + CORS + rutas
import express from 'express';
import cors, { type CorsOptions } from 'cors';
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

app.get('/', (_req, res) => res.send('NutriHuella API 🚀'));
app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);

export default app;
