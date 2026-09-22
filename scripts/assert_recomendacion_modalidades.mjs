/**
 * Assert: «Hoy te conviene» resume Río / Orilla / Barco en provincias multi-modo.
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

const util = read("src/utils/recomendacionHoy.ts");
for (const n of [
  "elegirRecomendacionesHoyPack",
  "RecomendacionModoHoy",
  "RecomendacionHoyPack",
  "rankearCercaMejorPinta",
  "calcularIndiceBarco",
  "sitioEncajaModo",
]) {
  if (!util.includes(n)) fail(`recomendacionHoy sin ${n}`);
}

const card = read("src/components/RecomendacionHoyCard.tsx");
for (const n of [
  "Hoy te conviene",
  "elegirRecomendacionesHoyPack",
  "modosLista",
  "mejor hoy",
  "porModo",
  "modos.length",
]) {
  if (!card.includes(n)) fail(`RecomendacionHoyCard sin ${n}`);
}

const home = read("src/screens/HomeScreen.tsx");
if (!home.includes("modos={disponibles}")) fail("Home debe pasar modos disponibles a RecomendacionHoyCard");
if (!home.includes("ancla={{")) fail("Home debe pasar ancla (GPS/centro) a RecomendacionHoyCard");
if (!home.includes("setModo(modoRec)")) {
  fail("Home debe setModo al tocar una modalidad de «Hoy te conviene»");
}

const pkg = read("package.json");
if (!pkg.includes("assert_recomendacion_modalidades.mjs")) {
  fail("package.json debe incluir assert_recomendacion_modalidades.mjs");
}

if (fallos) {
  console.error(`assert_recomendacion_modalidades: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_recomendacion_modalidades");
