/**
 * Assert: guía de compra de aparejos por especie (anzuelo, arponcillo, cebador, plomo).
 * Uso: node scripts/assert_recomendaciones_aparejo.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let fallos = 0;
function fail(msg) {
  console.error("FAIL", msg);
  fallos++;
}
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const data = read("src/data/recomendacionesAparejo.ts");
for (const needle of [
  "export type RecomendacionAparejo",
  "RECOMENDACIONES_APAREJO",
  "recomendacionAparejo",
  "restriccionesParaProvincia",
  "etiquetaArponcillo",
  "anzueloTipo",
  "anzueloTalla",
  "arponcillo",
  "cebador",
  "plomos",
  "compraRapida",
  "obligatorio_sin",
  "Method / flat",
  "pirámide",
  "PORN Serranía",
  "Decreto 41/2013",
  "ambito: \"costa\"",
]) {
  if (!data.includes(needle)) fail(`recomendacionesAparejo.ts falta «${needle}»`);
}

const n = (data.match(/especieId: "/g) || []).length;
if (n < 30) fail(`Se esperan ≥30 fichas de recomendación (hay ${n})`);

// boga río + costa
if ((data.match(/especieId: "boga"/g) || []).length < 2) {
  fail("boga debe tener ficha río y costa");
}

const tabla = read("src/components/TablaRecomendacionAparejo.tsx");
for (const needle of [
  "Guía de compra del aparejo",
  "Plomo según lo que va en el anzuelo",
  "Lista corta de tienda",
  "Restricciones en tu provincia",
  "etiquetaArponcillo",
  "restriccionesParaProvincia",
]) {
  if (!tabla.includes(needle)) fail(`TablaRecomendacionAparejo falta «${needle}»`);
}

const aparejos = read("src/screens/AparejosScreen.tsx");
for (const needle of ["recomendacionAparejo", "TablaRecomendacionAparejo", "guiaCompra"]) {
  if (!aparejos.includes(needle)) fail(`AparejosScreen falta «${needle}»`);
}
if (!aparejos.includes("guía de compra") && !aparejos.includes("Guía de compra")) {
  fail("AparejosScreen debe mencionar guía de compra");
}
if (!aparejos.includes("anzuelo, arponcillo, cebador, plomo")) {
  fail("AparejosScreen hint debe citar anzuelo, arponcillo, cebador, plomo");
}

const consejos = read("src/data/consejos.ts");
if (!consejos.includes("ap-guia-compra") || !consejos.includes("Guía de compra por especie")) {
  fail("consejos.ts debe incluir tip ap-guia-compra");
}

const pkg = read("package.json");
if (!pkg.includes("assert_recomendaciones_aparejo.mjs")) {
  fail("package.json assert debe incluir assert_recomendaciones_aparejo.mjs");
}

if (fallos) {
  console.error(`assert_recomendaciones_aparejo: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK: guía de compra aparejos por especie");
