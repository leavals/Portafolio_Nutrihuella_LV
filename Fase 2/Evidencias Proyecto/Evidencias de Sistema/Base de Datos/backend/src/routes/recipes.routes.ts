// src/routes/recipes.routes.ts
/**
 * Rutas de recetas: generación y favoritos.
 * Protegidas por authGuard.
 */
import { Router } from "express";
import { authGuard } from "../middleware/auth.middleware.ts";
import {
  generateRecipe,
  addFavorite,
  listFavorites,
  deleteFavorite,
} from "../controllers/recipes.controller.ts";

const r = Router();
r.use(authGuard);

// Generación
r.post("/generate", generateRecipe);

// Favoritos
r.post("/favorites", addFavorite);            // crear
r.get("/favorites", listFavorites);           // listar por usuario
r.delete("/favorites/:id", deleteFavorite);   // eliminar propio

export default r;
