/**
 * Assert: en Castellón (única provincia costera activa) todos los puertos
 * marcan pesca prohibida (no coto) para orilla/kayak/barco, y los polígonos
 * cubren marina/dársena reales de referencia.
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

function minToDec(d, min, hem) {
  const v = d + min / 60;
  return hem === "S" || hem === "W" ? -v : v;
}

/** Solo Castellón tiene costa entre las provincias activas. */
const configs = ["castellon", "sevilla", "cordoba", "cuenca"].map((id) => {
  const t = read(`src/provincias/${id}/config.ts`);
  return { id, costa: /regionCosta|ambito.*mar|playas|puertos/i.test(t) || id === "castellon" };
});
const castellonCfg = read("src/provincias/castellon/config.ts");
if (!/regionCosta|costa|mar/i.test(castellonCfg)) {
  fail("Castellón debería exponer costa/región marítima");
} else {
  ok("Castellón es la provincia costera del catálogo");
}
for (const id of ["sevilla", "cordoba", "cuenca"]) {
  const hasPuertosFile = fs.existsSync(path.join(root, `src/provincias/${id}/puertos.json`));
  if (hasPuertosFile) fail(`${id} no debería tener puertos marítimos propios aún`);
}
ok("Sevilla/Córdoba/Cuenca sin catálogo de puertos marítimos");

const costaSvc = read("src/services/consultaCostaService.ts");
if (!costaSvc.includes('from "../data/puertosCastellon.json"') && !costaSvc.includes("puertosCastellon")) {
  fail("consultaCosta debe cargar puertosCastellon.json");
}
if (!costaSvc.includes("Puerto · pesca prohibida") || !costaSvc.includes("NO es coto")) {
  fail("consultaCosta: todos los puertos deben decir pesca prohibida (no coto)");
}
ok("consultaCosta: veredicto unificado puerto");

const emb = read("src/services/consultaEmbarcacionService.ts");
for (const s of ["Puerto · pesca prohibida", "NO es coto", "Kayak incluido", "más allá de la bocana"]) {
  if (!emb.includes(s)) fail(`consultaEmbarcacion sin «${s}»`);
}
ok("consultaEmbarcacion: kayak/barco prohibidos en cualquier puerto");

const puertos = JSON.parse(read("src/data/puertosCastellon.json"));
const byId = Object.fromEntries(puertos.map((p) => [p.id, p]));
const idsEsperados = [
  "vinaros",
  "benicarlo",
  "peniscola",
  "alcossebre",
  "orpesa",
  "grao_cs",
  "burriana",
  "moncofa",
];
for (const id of idsEsperados) {
  if (!byId[id]) fail(`falta puerto ${id}`);
}
ok(`catálogo: ${idsEsperados.length} puertos Castellón`);

/** Puntos de referencia (club/Navily/OSM/GVA) que deben caer DENTRO del polígono. */
const refs = [
  { id: "vinaros", name: "Club Nàutic Vinaròs", lat: 40 + 27 / 60 + 52 / 3600, lng: 0 + 28 / 60 + 25 / 3600 },
  { id: "vinaros", name: "Navily Vinaròs", lat: minToDec(40, 27.87, "N"), lng: minToDec(0, 28.47, "E") },
  { id: "benicarlo", name: "Navily Marina Benicarló", lat: minToDec(40, 24.9, "N"), lng: minToDec(0, 26.07, "E") },
  { id: "peniscola", name: "OSM Port de Peníscola", lat: 40.3571535, lng: 0.4042234 },
  { id: "alcossebre", name: "GVA Las Fuentes 40º15' / 0º17'30\"", lat: 40.25, lng: 0.2916667 },
  { id: "alcossebre", name: "BoletinPatron Las Fuentes", lat: 40.24954891, lng: 0.28755612 },
  { id: "orpesa", name: "OSM Port d'Orpesa", lat: 40.0755626, lng: 0.1337858 },
  { id: "orpesa", name: "OSM Orpesa N", lat: 40.0783628, lng: 0.1338 },
  { id: "orpesa", name: "OSM Orpesa S", lat: 40.0732381, lng: 0.1338 },
  { id: "grao_cs", name: "Club Náutico CS", lat: 39.97017, lng: 0.0148 },
  { id: "grao_cs", name: "Plaza del Mar", lat: 39.9765, lng: 0.018 },
  { id: "grao_cs", name: "dársena", lat: 39.97, lng: 0.022 },
  { id: "burriana", name: "Navily Burriananova", lat: minToDec(39, 51.6, "N"), lng: minToDec(0, 4.25, "W") },
  { id: "burriana", name: "Navily Club Náutico Burriana", lat: minToDec(39, 51.73, "N"), lng: minToDec(0, 4.38, "W") },
  { id: "moncofa", name: "rampa Moncofa", lat: 39.791, lng: -0.147 },
];

/** Playas / fuera de puerto que NO deben quedar dentro. */
const fuera = [
  { id: "grao_cs", name: "Playa del Pinar", lat: 39.98415, lng: 0.02415 },
  { id: "orpesa", name: "platja Orpesa norte (antiguo polígono erróneo)", lat: 40.092, lng: 0.138 },
  { id: "alcossebre", name: "Carregador/Romana (antiguo polígono)", lat: 40.2408, lng: 0.2905 },
  { id: "alcossebre", name: "Cala Blanca", lat: 40.25845, lng: 0.29624 },
  { id: "burriana", name: "Playa Arenal", lat: 39.852, lng: -0.062 },
  { id: "vinaros", name: "Playa Fortí", lat: 40.468, lng: 0.4765 },
];

for (const r of refs) {
  const p = byId[r.id];
  if (!p) continue;
  if (!puntoEnPoligono(r.lat, r.lng, p.anillo)) {
    fail(`${r.id}: no cubre ${r.name} (${r.lat.toFixed(5)}, ${r.lng.toFixed(5)})`);
  }
}
ok("todos los puntos de marina/dársena de referencia quedan dentro");

for (const r of fuera) {
  const p = byId[r.id];
  if (!p) continue;
  if (puntoEnPoligono(r.lat, r.lng, p.anillo)) {
    fail(`${r.id}: invade ${r.name} (${r.lat.toFixed(5)}, ${r.lng.toFixed(5)})`);
  }
}
ok("polígonos no invaden playas / ubicaciones antiguas erróneas");

const rampas = JSON.parse(read("src/data/rampasEmbarcacion.json")).rampas;
const rampaPuerto = {
  rampa_vinaros: "vinaros",
  rampa_benicarlo: "benicarlo",
  rampa_peniscola: "peniscola",
  rampa_alcossebre: "alcossebre",
  rampa_orpesa: "orpesa",
  rampa_grao: "grao_cs",
  rampa_burriana: "burriana",
  rampa_moncofa: "moncofa",
};
for (const [rid, pid] of Object.entries(rampaPuerto)) {
  const r = rampas.find((x) => x.id === rid);
  const p = byId[pid];
  if (!r) {
    fail(`falta rampa ${rid}`);
    continue;
  }
  if (!puntoEnPoligono(r.lat, r.lng, p.anillo)) {
    fail(`rampa ${rid} fuera del polígono ${pid}`);
  }
}
ok("rampas de puerto alineadas con polígonos");

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
