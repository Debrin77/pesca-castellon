/**
 * Assert: «Hoy te conviene» —
 * · varias modalidades → mejor de cada una (río / orilla / barco)
 * · continental (un modo) → top 3 zonas del mismo tipo
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
  "elegirTopZonasHoy",
  "RecomendacionModoHoy",
  "RecomendacionHoyPack",
  "rankearCercaMejorPinta",
  "calcularIndiceBarco",
  "sitioEncajaModo",
  "anclaCosta",
  "mejorDeModo",
  "mejorDesdeCatalogo",
  "topN",
]) {
  if (!util.includes(n)) fail(`recomendacionHoy sin ${n}`);
}

const card = read("src/components/RecomendacionHoyCard.tsx");
for (const n of [
  "Hoy te conviene",
  "elegirRecomendacionesHoyPack",
  "elegirTopZonasHoy",
  "modosLista",
  "Mejor de cada modalidad hoy",
  "Mejores zonas hoy",
  "porModo",
  "modos.length",
  "anclaCosta",
  "badgeMejor",
  "topN: 3",
]) {
  if (!card.includes(n)) fail(`RecomendacionHoyCard sin ${n}`);
}
// No debe quedar el hero de una sola modalidad como única recomendación visible.
if (card.includes("modoDestacadoSuave") || card.includes("destacadaHit")) {
  fail("RecomendacionHoyCard no debe priorizar un único hero; todas las modalidades al mismo nivel");
}
// Continental: no volver a la tarjeta clásica de un solo sitio.
if (card.includes("elegirRecomendacionHoy")) {
  fail("RecomendacionHoyCard no debe usar elegirRecomendacionHoy; continental usa top 3");
}

const explorar = read("src/components/PanelExplorarSitios.tsx");
if (!explorar.includes("modos={disponibles}")) {
  fail("PanelExplorarSitios debe pasar modos disponibles a RecomendacionHoyCard");
}
if (!explorar.includes("ancla={{")) {
  fail("PanelExplorarSitios debe pasar ancla (GPS/centro) a RecomendacionHoyCard");
}
if (!explorar.includes("anclaCosta=")) {
  fail("PanelExplorarSitios debe pasar anclaCosta (regionCosta) a RecomendacionHoyCard");
}
if (!explorar.includes("setModo(modoRec)")) {
  fail("PanelExplorarSitios debe setModo al tocar una modalidad de «Hoy te conviene»");
}
const mapa = read("src/screens/ZonasLibresScreen.tsx");
if (!mapa.includes("PanelExplorarSitios")) {
  fail("Mapa debe montar PanelExplorarSitios con RecomendacionHoyCard");
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
