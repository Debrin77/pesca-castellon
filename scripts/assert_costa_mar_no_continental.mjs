/**
 * Assert: un toque en el mar (modo costa) no cae al tramo continental más cercano.
 * Debe informar distancia a orilla / mar abierto, ámbito marítimo.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
let fallos = 0;

function fail(msg) {
  console.error(`FAIL ${msg}`);
  fallos++;
}
function ok(msg) {
  console.log(`OK ${msg}`);
}
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const costaSvc = read("src/services/consultaCostaService.ts");
for (const n of [
  "esMarCastellon",
  "distanciaACostaCastellonKm",
  "Mar abierto",
  "No es un tramo continental",
]) {
  if (!costaSvc.includes(n)) fail(`consultaCostaService sin ${n}`);
}
if (!/esFranjaCosteraCastellon\(lat, lng\)\s*\|\|\s*esMarCastellon\(lat, lng\)/.test(costaSvc)) {
  fail("consultarToqueMapa debe incluir esMarCastellon además de la franja");
}
ok("consultaCostaService API mar/orilla");

const emb = read("src/services/consultaEmbarcacionService.ts");
if (!emb.includes("esMarCastellon")) {
  fail("consultaEmbarcacion debe usar esMarCastellon (no bbox tierra+mar)");
}
ok("embarcación respeta mar vs tierra");

const mapa = read("src/screens/ZonasLibresScreen.tsx");
if (!mapa.includes("consultarCosta(lat, lng)")) {
  fail("ZonasLibresScreen en modo costa debe llamar consultarCosta");
}
if (!mapa.includes("// En Costa (orilla): no caer al tramo continental")) {
  fail("ZonasLibresScreen debe documentar el camino costa sin continental");
}
ok("mapa costa → consultarCosta");

const especies = read("src/screens/EspeciesScreen.tsx");
if (!especies.includes("costa ? consultarCosta")) {
  fail("EspeciesScreen en modo costa debe llamar consultarCosta");
}
ok("especies costa → consultarCosta");

const pkg = read("package.json");
if (!pkg.includes("assert_costa_mar_no_continental.mjs")) {
  fail("package.json assert debe incluir assert_costa_mar_no_continental.mjs");
}

// Runtime: punto en mar ≠ tramo continental más cercano.
const runtime = `
import { setProvinciaActiva } from './src/provincias/runtime.ts';
import { consultarToqueMapa } from './src/services/consultaCostaService.ts';
import { consultarPuntoPesca } from './src/services/consultaPescaService.ts';
setProvinciaActiva('castellon');
const mar = { lat: 39.98, lng: 0.15 };
const sea = consultarToqueMapa(mar.lat, mar.lng);
const cont = consultarPuntoPesca(mar.lat, mar.lng);
if (sea.ambito !== 'maritimo') throw new Error('ambito=' + sea.ambito);
if (sea.tramo) throw new Error('tramo continental inesperado: ' + sea.tramo.nombre);
if (!String(sea.titulo).includes('Mar abierto')) throw new Error('titulo=' + sea.titulo);
if (sea.titulo === cont.titulo) throw new Error('mismo titulo que continental');
if (!(sea.distanciaKm > 2)) throw new Error('distanciaKm=' + sea.distanciaKm);
console.log('RUNTIME_OK', sea.titulo, 'vs', cont.titulo);
`;
const run = spawnSync("npx", ["--yes", "tsx", "-e", runtime], {
  cwd: root,
  encoding: "utf8",
  timeout: 60_000,
});
if (run.status !== 0) {
  fail(`runtime mar≠continental: ${(run.stderr || run.stdout || "").slice(0, 500)}`);
} else if (!(run.stdout || "").includes("RUNTIME_OK")) {
  fail("runtime sin RUNTIME_OK");
} else {
  ok((run.stdout || "").trim().split("\n").pop());
}

if (fallos) {
  console.error(`assert_costa_mar_no_continental: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_costa_mar_no_continental");
