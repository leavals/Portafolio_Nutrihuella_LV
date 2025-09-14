// backend/src/routes/pantry.routes.ts
import { Router } from "express";
import { authGuard } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

import { PantryCreateSchema, PantryUpdateSchema } from "../schemas/pantry.schema.js";
import {
  pantryList,
  pantryCreate,
  pantryUpdate,
  pantryDelete,
  pantryExpiring,
  pantrySummary,
  pantryForPet,
} from "../controllers/pantry.controller.js";

const r = Router();
r.use(authGuard);

// Despensa general
r.get("/", pantryList);
r.post("/", validate(PantryCreateSchema), pantryCreate);
r.patch("/:itemId", validate(PantryUpdateSchema), pantryUpdate);
r.delete("/:itemId", pantryDelete);

// Utilidades
r.get("/expiring", pantryExpiring);
r.get("/summary", pantrySummary);

// Usable por mascota (filtrado por ficha nutricional)
r.get("/usable/:petId", pantryForPet);
// alias opcional:
// r.get("/:petId/usable", pantryForPet);

export default r;
