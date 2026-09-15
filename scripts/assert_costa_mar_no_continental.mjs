/**
 * Assert: un toque en el mar (modo costa) no cae al tramo continental más cercano.
 * Debe informar distancia a orilla / mar abierto, ámbito marítimo.
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

if (fallos) {
  console.error(`assert_costa_mar_no_continental: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_costa_mar_no_continental");
