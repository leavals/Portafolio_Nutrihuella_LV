// src/app.ts
import express from "express";
// Importación correcta para módulos CommonJS: default + type-only
import cors from "cors";
import type { CorsOptions } from "cors";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.ts";
import usersRoutes from "./routes/users.routes.ts";
import petsRoutes from "./routes/pets.routes.ts";
import pantryRoutes from "./routes/pantry.routes.ts";
import recipesRoutes from "./routes/recipes.routes.ts";
import paymentsRoutes from "./routes/payments.routes.ts";
import limitsRoutes from "./routes/limits.routes.ts";

const app = express();

/**
 * CORS para DEV + Expo Web:
 * - Permitimos localhost:3000 (web Next) y 8081/19006 (Expo Web).
 * - Respondemos a preflight OPTIONS para TODAS las rutas.
 * - No enviamos cookies (credentials:false). Usamos Authorization: Bearer.
 */
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:19006",
  "http://127.0.0.1:19006",
];

const corsOptions: CorsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? allowedOrigins
      : // En desarrollo permitimos cualquier origen para evitar bloqueos al probar desde Expo Web.
        true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false, // usamos JWT por header, no cookies
  optionsSuccessStatus: 204,
};

// IMPORTANTE: CORS debe ir antes de cualquier router
app.use(cors(corsOptions));
// Responder preflight para cualquier ruta
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

// Healthcheck simple (útil para pruebas rápidas)
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Rutas existentes (sin cambios)
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/pets", petsRoutes);
app.use("/api/pantry", pantryRoutes);
app.use("/api/recipes", recipesRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/limits", limitsRoutes);

export default app;
