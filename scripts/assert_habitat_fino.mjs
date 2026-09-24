/**
 * Assert: hábitat fino por provincia + boost en ranking por especie + UI.
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
  "src/data/habitat.ts",
  "src/services/habitatService.ts",
  "src/provincias/sevilla/habitatZonas.json",
  "src/provincias/cordoba/habitatZonas.json",
  "src/provincias/cuenca/habitatZonas.json",
  "src/data/habitatCastellon.json",
]) {
  if (!exists(f)) fail(`falta ${f}`);
}

const hab = read("src/data/habitat.ts");
for (const n of [
  "HabitatTag",
  "HabitatSitio",
  "AFINIDAD_ESPECIE_TAGS",
  "boostHabitatEspecie",
  "ETIQUETA_TAG",
  "troncos",
  "vegetacion",
  "limo",
  "profundidad",
]) {
  if (!hab.includes(n)) fail(`habitat.ts sin ${n}`);
}

const svc = read("src/services/habitatService.ts");
for (const n of ["habitatDeZona", "habitatDePlaya", "habitatDeCandidatoId"]) {
  if (!svc.includes(n)) fail(`habitatService sin ${n}`);
}

const se = JSON.parse(read("src/provincias/sevilla/habitatZonas.json"));
if (!se.embalse_de_jarrama?.tags?.includes("troncos")) {
  fail("Sevilla Jarrama debe listar troncos (árboles hundidos)");
}
if (!se.embalse_de_alcala_del_rio?.tags?.includes("limo")) {
  fail("Sevilla Alcalá debe listar limo");
}

const co = JSON.parse(read("src/provincias/cordoba/habitatZonas.json"));
if (!co.embalse_de_iznajar?.tags?.includes("vegetacion")) {
  fail("Córdoba Iznájar debe listar vegetacion");
}

const cu = JSON.parse(read("src/provincias/cuenca/habitatZonas.json"));
if (!cu.embalse_de_buendia?.tags?.includes("estiaje")) {
  fail("Cuenca Buendía debe marcar estiaje (nivel variable)");
}

const cs = JSON.parse(read("src/data/habitatCastellon.json"));
if (!cs.zonas?.embalse_arenos?.tags?.includes("roca")) {
  fail("Castellón Arenós debe listar roca");
}
if (!cs.playas?.grao_pinar) fail("Castellón playas deben enriquecer grao_pinar");

const util = read("src/utils/recomendacionPorEspecie.ts");
for (const n of ["boostHabitatEspecie", "habitatResumen", "resumenHabitat"]) {
  if (!util.includes(n)) fail(`recomendacionPorEspecie sin ${n}`);
}

const top = read("src/components/TopSitiosEspecie.tsx");
if (!top.includes("habitatResumen")) fail("TopSitiosEspecie sin habitatResumen");

const zone = read("src/screens/ZoneDetailScreen.tsx");
for (const n of ["habitatDeZona", "ProfundidadHabitatHoy"]) {
  if (!zone.includes(n)) fail(`ZoneDetail sin ${n}`);
}

const profundidad = read("src/components/ProfundidadHabitatHoy.tsx");
for (const n of ["Profundidad y hábitat hoy", "lecturaPesca", "etiquetaSello"]) {
  if (!profundidad.includes(n)) fail(`ProfundidadHabitatHoy sin ${n}`);
}

const pkg = read("package.json");
if (!pkg.includes("assert_habitat_fino.mjs")) {
  fail("package.json assert debe incluir assert_habitat_fino.mjs");
}

if (fallos) {
  console.error(`assert_habitat_fino: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_habitat_fino");
