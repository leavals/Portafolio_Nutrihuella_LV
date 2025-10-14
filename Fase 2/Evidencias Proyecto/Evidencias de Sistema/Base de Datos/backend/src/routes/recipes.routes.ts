// src/routes/recipes.routes.ts
import { Router } from "express";
import { generateRecipe, addFavorite, sendFeedback } from "../controllers/recipes.controller.ts";
import { authGuard } from "../middleware/auth.middleware.ts";

const router = Router();

// Necesitamos saber el userId para cargar la despensa del usuario y validar petId
router.use(authGuard);

router.post("/generate", generateRecipe);
router.post("/favorites", addFavorite);
router.post("/:id/feedback", sendFeedback);

export default router;
