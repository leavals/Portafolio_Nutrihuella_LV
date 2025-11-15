// src/env.ts
import { z } from "zod";

// Acepta "correo@dominio" o "Nombre <correo@dominio>"
const EmailFromSchema = z.union([
  z.string().email(),
  z.string().regex(
    /^[^"<>]+<\s*[^<>\s@]+@[^<>\s@]+\s*>$/,
    "Formato inválido para MAIL_FROM. Usa por ejemplo: NutriHuella <nutrihuellachile@gmail.com>"
  ),
]);

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Base
  DATABASE_URL: z.string().min(1, "DATABASE_URL requerido"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET muy corto"),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default("0.0.0.0"), // ← agregado

  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  // Frontend base (para links de verify/reset)
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),

  // IA (Ollama)
  OLLAMA_BASE_URL: z.string().default("http://127.0.0.1:11434"),
  OLLAMA_MODEL: z.string().default("llama3.1:8b"),

  // Google Sign-In (opcional)
  GOOGLE_CLIENT_ID: z.string().optional(),

  // Webpay Plus
  TBK_ENV: z.enum(["integration", "production"]).default("integration"),
  TBK_COMMERCE_CODE: z.string().optional(),
  TBK_API_KEY: z.string().optional(),
  TBK_RETURN_URL: z.string().url().default("http://localhost:3000/plus/return"),
  TBK_FINAL_URL: z.string().url().default("http://localhost:3000/plus/success"),

  // SMTP (Gmail u otro)
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_SECURE: z.coerce.boolean().default(true), // ← coerce: "true"/"false" → boolean
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: EmailFromSchema.default("nutrihuellachile@gmail.com"), // acepta "Nombre <mail>" o solo mail
});

export const env = EnvSchema.parse(process.env);
export const isProduction = env.NODE_ENV === "production";
export const isIntegration = env.TBK_ENV === "integration";
