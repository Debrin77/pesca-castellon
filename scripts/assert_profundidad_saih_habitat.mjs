/**
 * Assert: profundidad viva SAIH + hábitat con sellos oficial/orientativo.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let fallos = 0;
function fail(m) {
  console.error("FAIL", m);
  fallos++;
}
function read(r) {
  return fs.readFileSync(path.join(root, r), "utf8");
}
function exists(r) {
  return fs.existsSync(path.join(root, r));
}

for (const f of [
  "src/utils/profundidadEmbalseHoy.ts",
  "src/components/ProfundidadHabitatHoy.tsx",
]) {
  if (!exists(f)) fail(`falta ${f}`);
}

const util = read("src/utils/profundidadEmbalseHoy.ts");
for (const n of [
  "lecturaProfundidadHoy",
  "bandaNivelEmbalse",
  "consejoPescaPorNivel",
  "oficial",
  "orientativo",
  "etiquetaSello",
  "muy_bajo",
  "Orillas de nivel alto al descubierto",
]) {
  if (!util.includes(n)) fail(`profundidadEmbalseHoy sin ${n}`);
}

const ui = read("src/components/ProfundidadHabitatHoy.tsx");
for (const n of [
  "Profundidad y hábitat hoy",
  "lecturaProfundidadHoy",
  "etiquetaSello",
  "Sin batimetría oficial",
  "StyleSheet.create",
]) {
  if (!ui.includes(n)) fail(`ProfundidadHabitatHoy sin ${n}`);
}

const zone = read("src/screens/ZoneDetailScreen.tsx");
if (!zone.includes("ProfundidadHabitatHoy")) fail("ZoneDetail sin ProfundidadHabitatHoy");
if (zone.includes("Hábitat del sitio") && !zone.includes("Profundidad y hábitat")) {
  fail("ZoneDetail no debe quedarse solo con el bloque antiguo de hábitat");
}

const pkg = read("package.json");
if (!pkg.includes("assert_profundidad_saih_habitat.mjs")) {
  fail("package.json assert debe incluir assert_profundidad_saih_habitat.mjs");
}

if (fallos) {
  console.error(`assert_profundidad_saih_habitat: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_profundidad_saih_habitat");
