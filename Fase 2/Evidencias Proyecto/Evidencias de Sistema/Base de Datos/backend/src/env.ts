// src/env.ts
export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "4000", 10),
  DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
  JWT_SECRET: process.env.JWT_SECRET || "cambia-esto-por-un-secreto-aleatorio",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",

  // 👇 NUEVO: configuración IA (Ollama)
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || "llama3.1:8b",
};
