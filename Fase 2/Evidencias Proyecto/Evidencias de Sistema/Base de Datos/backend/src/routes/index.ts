// src/routes/index.ts
import { Router } from 'express';

// Rutas existentes
import authRoutes from './auth.routes.ts';
import petsRoutes from './pets.routes.ts';
import pantryRoutes from './pantry.routes.ts';
import recipesRoutes from './recipes.routes.ts';

// NUEVO: analítica
import analyticsRoutes from './analytics.routes.ts';

const router = Router();

router.use('/auth', authRoutes);
router.use('/pets', petsRoutes);
router.use('/pantry', pantryRoutes);
router.use('/recipes', recipesRoutes);

// Monta /api/analytics/*
router.use('/analytics', analyticsRoutes);

export default router;
