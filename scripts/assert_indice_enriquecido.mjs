/**
 * Assert: índice de pesca enriquecido (temp aire/agua, solunar, franjas horarias).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
let fallos = 0;
function fail(msg) {
  console.error(`FAIL ${msg}`);
  fallos++;
}
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const idx = read("src/services/fishingIndexService.ts");
for (const n of [
  "puntuarTemperaturaAire",
  "puntuarTemperaturaAgua",
  "puntuarLunaSolunar",
  "puntuarHoraRelativa",
  "construirFranjas",
  "tempMediaC",
  "tempAguaC",
  "fuenteTempAgua",
  "mejorFranjaInicio",
  "mejorFranjaFin",
  "sea_surface_temperature",
  "soil_temperature_0cm",
  "calcularSolunarDia",
  "AbortController",
  "10_000",
  "memoIndice",
  "TTL_INDICE_MS",
  "máx. 22",
  "máx. 16",
  "máx. 12",
]) {
  if (!idx.includes(n)) fail(`fishingIndexService sin ${n}`);
}

const home = read("src/screens/HomeScreen.tsx");
if (!home.includes("mejorFranjaInicio") || !home.includes("pulsoFranja")) {
  fail("HomeScreen debe mostrar la mejor franja del índice enriquecido");
}

const prev = read("src/screens/PrevisionScreen.tsx");
if (!prev.includes("tempAguaC") || !prev.includes("clima, agua y luna")) {
  fail("PrevisionScreen debe mostrar agua/franja del índice enriquecido");
}

const ejes = read("src/data/ejesLegalMeteo.ts");
if (!ejes.includes("agua y luna") && !ejes.includes("temperatura y luna")) {
  fail("EJE_METEO debe mencionar agua/temperatura además del clima");
}

const pkg = read("package.json");
if (!pkg.includes("assert_indice_enriquecido.mjs")) {
  fail("package.json assert debe incluir assert_indice_enriquecido.mjs");
}

if (fallos) {
  console.error(`assert_indice_enriquecido: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_indice_enriquecido");
