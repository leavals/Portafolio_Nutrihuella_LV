// src/env.ts
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Base
  DATABASE_URL: z.string().min(1, "DATABASE_URL requerido"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET muy corto"),
  PORT: z.coerce.number().default(4000),

  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  // IA (Ollama)
  OLLAMA_BASE_URL: z.string().default("http://127.0.0.1:11434"),
  OLLAMA_MODEL: z.string().default("llama3.1:8b"),

  // Google Sign-In (opcional)
  GOOGLE_CLIENT_ID: z.string().optional(),

  // Transbank Webpay Plus
  TBK_ENV: z.enum(["integration", "production"]).default("integration"),
  TBK_COMMERCE_CODE: z.string().optional(),
  TBK_API_KEY: z.string().optional(),
  TBK_RETURN_URL: z.string().url().default("http://localhost:3000/plus/return"),
  TBK_FINAL_URL: z.string().url().default("http://localhost:3000/plus/success"),
});

export const env = EnvSchema.parse(process.env);

export const isProduction = env.NODE_ENV === "production";
export const isIntegration = env.TBK_ENV === "integration";
