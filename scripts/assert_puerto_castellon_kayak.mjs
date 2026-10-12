/**
 * Assert: dentro del Puerto de Castellón la pesca (kayak/barco/orilla) es
 * prohibida (no coto). El polígono debe cubrir marina / Plaza del Mar / dársena.
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
function ok(msg) {
  console.log("OK", msg);
}
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function puntoEnPoligono(lat, lng, anillo) {
  let inside = false;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const xi = anillo[i].lng;
    const yi = anillo[i].lat;
    const xj = anillo[j].lng;
    const yj = anillo[j].lat;
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

const puertos = JSON.parse(read("src/data/puertosCastellon.json"));
const grao = puertos.find((p) => p.id === "grao_cs");
if (!grao) fail("falta puerto grao_cs");
else if (!/Puerto de Castell[oó]n/i.test(grao.nombre)) {
  fail("grao_cs debe llamarse Puerto de Castellón");
} else {
  ok("grao_cs presente");
}

const debeCubrir = [
  ["dársena", 39.97, 0.022],
  ["Plaza del Mar", 39.9765, 0.018],
  ["Club Náutico", 39.97017, 0.0148],
  ["bocana", 39.965, 0.025],
  ["dique este", 39.968, 0.028],
];
const noDebeCubrir = [
  ["Playa del Pinar", 39.98415, 0.02415],
  ["mar abierto", 39.97, 0.05],
];

if (grao) {
  for (const [n, lat, lng] of debeCubrir) {
    if (!puntoEnPoligono(lat, lng, grao.anillo)) {
      fail(`polígono grao_cs no cubre ${n} (${lat}, ${lng})`);
    }
  }
  for (const [n, lat, lng] of noDebeCubrir) {
    if (puntoEnPoligono(lat, lng, grao.anillo)) {
      fail(`polígono grao_cs invade ${n} (${lat}, ${lng})`);
    }
  }
  if (fallos === 0) ok("polígono PortCastelló cubre dársena/marina sin invadir Pinar");
}

const emb = read("src/services/consultaEmbarcacionService.ts");
for (const s of [
  "Puerto · pesca prohibida",
  "NO es coto",
  "Kayak incluido",
  "más allá de la bocana",
]) {
  if (!emb.includes(s)) fail(`consultaEmbarcacion sin «${s}»`);
}
ok("consultaEmbarcacion: prohibido kayak en puerto");

const costa = read("src/services/consultaCostaService.ts");
for (const s of ["Puerto · pesca prohibida", "NO es coto", "Plaza del Mar"]) {
  if (!costa.includes(s)) fail(`consultaCosta sin «${s}»`);
}
ok("consultaCosta: prohibido orilla en puerto");

const norma = read("src/data/normativaMaritima.ts");
if (!norma.includes("NO es coto") || !/kayak y barco/i.test(norma)) {
  fail("normativaMaritima debe dejar claro que puerto ≠ coto (kayak/barco)");
}
ok("normativaMaritima");

const capa = read("src/components/CapaPuertos.tsx");
if (!/prohibido, no es coto/i.test(capa)) {
  fail("CapaPuertos debe documentar prohibido ≠ coto");
}
ok("CapaPuertos");

const pkg = read("package.json");
if (!pkg.includes("assert_puerto_castellon_kayak.mjs")) {
  fail("package.json debe incluir assert_puerto_castellon_kayak.mjs");
}

if (fallos) {
  console.error(`assert_puerto_castellon_kayak: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_puerto_castellon_kayak");
