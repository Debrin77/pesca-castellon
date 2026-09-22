/**
 * Assert: «Hoy te conviene» muestra la mejor de cada modalidad (río / orilla / barco).
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
  "anclaCosta",
  "mejorDeModo",
  "mejorDesdeCatalogo",
]) {
  if (!util.includes(n)) fail(`recomendacionHoy sin ${n}`);
}

const card = read("src/components/RecomendacionHoyCard.tsx");
for (const n of [
  "Hoy te conviene",
  "elegirRecomendacionesHoyPack",
  "modosLista",
  "Mejor de cada modalidad hoy",
  "porModo",
  "modos.length",
  "anclaCosta",
  "badgeMejor",
]) {
  if (!card.includes(n)) fail(`RecomendacionHoyCard sin ${n}`);
}
// No debe quedar el hero de una sola modalidad como única recomendación visible.
if (card.includes("modoDestacadoSuave") || card.includes("destacadaHit")) {
  fail("RecomendacionHoyCard no debe priorizar un único hero; todas las modalidades al mismo nivel");
}

const home = read("src/screens/HomeScreen.tsx");
if (!home.includes("modos={disponibles}")) fail("Home debe pasar modos disponibles a RecomendacionHoyCard");
if (!home.includes("ancla={{")) fail("Home debe pasar ancla (GPS/centro) a RecomendacionHoyCard");
if (!home.includes("anclaCosta=")) fail("Home debe pasar anclaCosta (regionCosta) a RecomendacionHoyCard");
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
