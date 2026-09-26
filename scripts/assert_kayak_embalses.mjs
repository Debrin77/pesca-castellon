/**
 * Assert: fichas kayak/navegación por embalse del catálogo.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

let fails = 0;
function fail(msg) {
  console.error("FAIL", msg);
  fails++;
}

const data = read("src/data/navegacionKayakEmbalses.ts");
const panel = read("src/components/PanelKayakEmbalse.tsx");
const zone = read("src/screens/ZoneDetailScreen.tsx");

for (const id of [
  "embalse_arenos",
  "embalse_sichar",
  "embalse_maria_cristina",
  "embalse_ulldecona",
  "embalse_de_alarcon",
  "embalse_de_contreras",
  "embalse_de_buendia",
  "embalse_de_cala",
  "embalse_de_iznajar",
  "embalse_de_jose_toran",
]) {
  if (!data.includes(`zoneId: "${id}"`)) fail(`falta ficha kayak ${id}`);
}

if (!data.includes("Declaración responsable")) fail("debe citar declaración responsable");
if (!data.includes("no_autorizado")) fail("debe marcar embalses no autorizados (CHG abastecimiento)");
if (!panel.includes("Navegación kayak") || !panel.includes("Pesca desde kayak")) {
  fail("PanelKayakEmbalse debe mostrar navegación y pesca");
}
if (!zone.includes("PanelKayakEmbalse")) fail("ZoneDetailScreen debe montar PanelKayakEmbalse");

const pkg = read("package.json");
if (!pkg.includes("assert_kayak_embalses.mjs")) {
  fail("package.json assert debe incluir assert_kayak_embalses.mjs");
}

if (fails) {
  console.error(`assert_kayak_embalses: ${fails} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_kayak_embalses");
