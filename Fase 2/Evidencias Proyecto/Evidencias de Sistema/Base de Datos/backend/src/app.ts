// src/app.ts
import express from "express";
import cors from "cors";
import type { CorsOptions } from "cors";
import morgan from "morgan";

// Rutas existentes
import authRoutes from "./routes/auth.routes.ts";
import usersRoutes from "./routes/users.routes.ts";
import petsRoutes from "./routes/pets.routes.ts";
import pantryRoutes from "./routes/pantry.routes.ts";
import recipesRoutes from "./routes/recipes.routes.ts";
import paymentsRoutes from "./routes/payments.routes.ts";
import limitsRoutes from "./routes/limits.routes.ts";

// NUEVO: rutas de administración y analítica
import adminRoutes from "./routes/admin.routes.ts";
import analyticsRoutes from "./routes/analytics.routes.ts";

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
      : true, // en desarrollo, permitir cualquier origen
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // IMPORTANTE: incluir el header que inyecta tu middleware de Next.js
  allowedHeaders: ["Content-Type", "Authorization", "X-Auth-Injected"],
  credentials: false, // usamos JWT por header, no cookies
  optionsSuccessStatus: 204,
};

// CORS y body/logging
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

// Healthchecks
app.get("/health", (_req, res) => res.send("ok"));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Montaje de rutas (orden no crítico, pero agrupado por dominio)
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/admin", adminRoutes);         // NUEVO
app.use("/api/analytics", analyticsRoutes); // NUEVO
app.use("/api/pets", petsRoutes);
app.use("/api/pantry", pantryRoutes);
app.use("/api/recipes", recipesRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/limits", limitsRoutes);

// 404 JSON para rutas no encontradas (evita HTML “Cannot GET …”)
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ message: "Not Found", path: req.originalUrl });
  }
  return next();
});

// Manejador de errores global (JSON)
app.use(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err?.status || 500;
    const message = err?.message || "Internal Server Error";
    // En producción, evita exponer stack completo
    const payload =
      process.env.NODE_ENV === "production"
        ? { message }
        : { message, stack: err?.stack, detail: err };
    // Log siempre en servidor
    // eslint-disable-next-line no-console
    console.error("UnhandledError:", { status, message, err });
    return res.status(status).json(payload);
  }
);

export default app;
