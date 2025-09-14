// backend/src/server.ts
import app from "./app.js";
import { env } from "./env.js";
import { prisma } from "./services/prisma.js"; // <- prisma vive acá ahora

const PORT = env.PORT ?? 4000;

async function main() {
  // Opcional: asegurar conexión a BD al iniciar
  try {
    await prisma.$connect();
    console.log("✅ Prisma conectado");
  } catch (e) {
    console.error("❌ Error conectando Prisma:", e);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`NutriHuella API escuchando en http://localhost:${PORT}`);
  });
}

// Cierre limpio (Ctrl+C / SIGTERM)
process.on("SIGINT", async () => {
  console.log("\n🛑 Cerrando servidor...");
  await prisma.$disconnect().catch(() => {});
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await prisma.$disconnect().catch(() => {});
  process.exit(0);
});

main();
