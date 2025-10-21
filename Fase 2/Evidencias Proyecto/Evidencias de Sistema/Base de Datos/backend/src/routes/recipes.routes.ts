// src/routes/recipes.routes.ts
import { Router } from "express";
import { authGuard } from "../middleware/auth.middleware.ts";
import { generateRecipe, addFavorite } from "../controllers/recipes.controller.ts";

const r = Router();
r.use(authGuard);

r.post("/generate", generateRecipe);
r.post("/favorites", addFavorite);

// (feedback u otros endpoints pueden añadirse aquí)

export default r;
