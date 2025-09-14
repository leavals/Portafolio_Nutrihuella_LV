// backend/src/app.ts
import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import petRoutes from "./routes/pets.routes.js";
import pantryRoutes from "./routes/pantry.routes.js"; // ⬅️ NUEVO

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/pantry", pantryRoutes); // ⬅️ NUEVO

export default app;
