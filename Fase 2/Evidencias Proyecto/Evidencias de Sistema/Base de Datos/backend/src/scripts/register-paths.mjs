// src/scripts/register-paths.mjs
// Registra paths de TS en entorno ESM sin parsear JSON a mano.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const tsConfigPaths = require("tsconfig-paths");

const __dirname = dirname(fileURLToPath(import.meta.url));
const configFile = resolve(__dirname, "../../tsconfig.json");

const { loadConfig, register } = tsConfigPaths;
const cfg = loadConfig(configFile);

if (cfg.resultType === "failed") {
  console.warn("[tsconfig-paths] loadConfig failed:", cfg.message);
} else {
  register({
    baseUrl: cfg.absoluteBaseUrl,
    paths: cfg.paths,
  });
}
