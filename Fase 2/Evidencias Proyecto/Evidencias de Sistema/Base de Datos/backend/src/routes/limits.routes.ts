// src/routes/limits.routes.ts
import { Router } from "express";
import { authGuard } from "../middleware/auth.middleware.ts";
import { getLimits } from "../controllers/limits.controller.ts";

const r = Router();
r.use(authGuard);
r.get("/", getLimits);

export default r;
