// src/server.ts
import app from "./app.ts";
import { env } from "./env.ts";
import { prisma } from "./services/prisma.ts";

const PORT = Number(env?.PORT ?? process.env.PORT ?? 4000);
const HOST = env?.HOST ?? process.env.HOST ?? "0.0.0.0"; // ← agregado

let server: any = null;

async function start() {
  try {
    await prisma.$connect();
    console.log("✅ Prisma conectado");

    // ← ahora bindea en 0.0.0.0 (o lo que venga en HOST)
    server = app.listen(PORT, HOST, () => {
      console.log(`✅ API escuchando en http://${HOST}:${PORT}`);
    });
  } catch (e) {
    console.error("❌ Error iniciando servidor:", e);
    process.exit(1);
  }
}

async function shutdown(signal: string) {
  console.log(`\n🛑 Recibido ${signal}. Cerrando servidor...`);

  try {
    await prisma.$disconnect();
  } catch (e) {
    console.error("Error al desconectar Prisma:", e);
  }

  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  shutdown("uncaughtException");
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  shutdown("unhandledRejection");
});

start();
