/**
 * Assert: guía de compra de aparejos por especie (anzuelo, arponcillo, cebador, plomo).
 * Uso: node scripts/assert_recomendaciones_aparejo.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

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
  "soloAmbito",
  "ambito: \"costa\"",
  "EMBARCACION_CS",
  'soloAmbito: "embarcacion"',
  "la licencia «desde tierra» no cubre barco",
]) {
  if (!data.includes(needle)) fail(`recomendacionesAparejo.ts falta «${needle}»`);
}

const n = (data.match(/especieId: "/g) || []).length;
if (n < 30) fail(`Se esperan ≥30 fichas de recomendación (hay ${n})`);

// boga río + costa
if ((data.match(/especieId: "boga"/g) || []).length < 2) {
  fail("boga debe tener ficha río y costa");
}

for (const sp of ["llobarro", "lucioperca"]) {
  if (!data.includes(`especieId: "${sp}"`)) fail(`Falta ficha recomendación ${sp}`);
}
for (const needle of ["CLM_SILURO_NO_OBJETO", "CS_SILURO_TRANSPORTE", "ANDALUCIA_NO_CEBAR"]) {
  if (!data.includes(needle)) fail(`recomendacionesAparejo falta «${needle}»`);
}

const tabla = read("src/components/TablaRecomendacionAparejo.tsx");
for (const needle of [
  "Guía de compra del aparejo",
  "Plomo según lo que va en el anzuelo",
  "Lista corta de tienda",
  "Restricciones",
  "ambitoLegal",
  "embarcacion",
  "etiquetaArponcillo",
  "restriccionesParaProvincia",
]) {
  if (!tabla.includes(needle)) fail(`TablaRecomendacionAparejo falta «${needle}»`);
}
if (tabla.includes('"Restricciones en tu provincia"') && !tabla.includes("embarcación")) {
  fail("TablaRecomendacionAparejo debe distinguir título orilla vs embarcación");
}

const aparejos = read("src/screens/AparejosScreen.tsx");
for (const needle of [
  "recomendacionAparejo",
  "TablaRecomendacionAparejo",
  "guiaCompra",
  'ambitoLegal={',
  '"embarcacion"',
]) {
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

// Runtime: en embarcación no debe salir «desde tierra» / 2 cañas de orilla.
const runtime = `
import { recomendacionAparejo, restriccionesParaProvincia } from './src/data/recomendacionesAparejo.ts';
const rec = recomendacionAparejo('lubina', 'embarcacion');
if (!rec) throw new Error('sin ficha lubina embarcacion');
const costa = restriccionesParaProvincia(rec, 'castellon', 'costa');
const barco = restriccionesParaProvincia(rec, 'castellon', 'embarcacion');
if (!costa.some((r) => r.texto.includes('desde tierra'))) throw new Error('costa debe tener orilla');
if (barco.some((r) => r.texto.includes('máx. 2 cañas desde tierra'))) {
  throw new Error('barco no debe mostrar 2 cañas desde tierra');
}
if (!barco.some((r) => r.texto.includes('no cubre barco') || r.soloAmbito === 'embarcacion')) {
  throw new Error('barco debe mostrar reglas de embarcación');
}
console.log('RUNTIME_OK', barco.map((r) => r.texto.slice(0, 60)).join(' | '));
`;
const run = spawnSync("npx", ["--yes", "tsx", "-e", runtime], {
  cwd: root,
  encoding: "utf8",
  timeout: 60_000,
});
if (run.status !== 0) {
  fail(`runtime embarcacion≠orilla: ${(run.stderr || run.stdout || "").slice(0, 500)}`);
} else if (!(run.stdout || "").includes("RUNTIME_OK")) {
  fail("runtime sin RUNTIME_OK");
} else {
  console.log("OK", (run.stdout || "").trim().split("\n").pop());
}

if (fallos) {
  console.error(`assert_recomendaciones_aparejo: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK: guía de compra aparejos por especie");
