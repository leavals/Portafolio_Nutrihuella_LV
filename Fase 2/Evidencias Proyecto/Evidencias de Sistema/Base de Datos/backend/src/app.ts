// src/app.ts
import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.ts";
import usersRoutes from "./routes/users.routes.ts";
import petsRoutes from "./routes/pets.routes.ts";
import pantryRoutes from "./routes/pantry.routes.ts";
import recipesRoutes from "./routes/recipes.routes.ts";

const app = express();

// CORS explícito para dev: 3000 -> 4000 con Authorization
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/pets", petsRoutes);
app.use("/api/pantry", pantryRoutes);
app.use("/api/recipes", recipesRoutes);

export default app;
