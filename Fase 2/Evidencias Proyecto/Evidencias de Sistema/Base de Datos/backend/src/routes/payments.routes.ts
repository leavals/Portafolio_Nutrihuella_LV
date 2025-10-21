// src/routes/payments.routes.ts
import { Router } from "express";
import { authGuard } from "../middleware/auth.middleware.ts";
import { initPlusPayment, commitPlusPayment } from "../controllers/payments.controller.ts";

const r = Router();
r.use(authGuard);

r.post("/plus/init", initPlusPayment);
r.post("/plus/commit", commitPlusPayment);

export default r;
