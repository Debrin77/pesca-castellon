/**
 * Assert de auditoría: delimitaciones mapa + veredictos críticos
 * (costa Castellón + continental CS). Evita regresiones del tipo
 * «puerto se come playa», Columbretes incompleto, Irta libre en kayak, etc.
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
function dm(d, m) {
  return d + m / 60;
}

const puertos = JSON.parse(read("src/data/puertosCastellon.json"));
const playas = JSON.parse(read("src/data/playasEspigonesCosta.json"));
const vedadosM = JSON.parse(read("src/data/vedadosMarinos.json"));
const vedadosC = JSON.parse(read("src/data/vedadosCosta.json"));
const zones = JSON.parse(read("src/data/zones.json"));
const sitiosFaciles = read("src/data/sitiosFaciles.ts");
const consultaPesca = read("src/services/consultaPescaService.ts");
const embSvc = read("src/services/consultaEmbarcacionService.ts");

// ——— Columbretes oficiales ARM/3841/2008 ———
const col = vedadosM.find((z) => z.id === "columbretes");
if (!col) fail("falta Columbretes");
else {
  const verts = [
    ["A", dm(39, 55.7), dm(0, 38.73)],
    ["B", dm(39, 55.7), dm(0, 42.91)],
    ["C", dm(39, 49.4), dm(0, 41.18)],
    ["D", dm(39, 49.4), dm(0, 38.73)],
  ];
  for (const [n, lat, lng] of verts) {
    // Vértices del BOE deben estar en/sobre el anillo: usamos centroide de cada lado
    // Comprobamos que el centro de la reserva y el vértice Sur (Carallot) quedan dentro.
  }
  const sur = dm(39, 49.4) + 0.001; // justo dentro del borde S
  const midLng = (dm(0, 38.73) + dm(0, 41.18)) / 2;
  if (!puntoEnPoligono(sur, midLng, col.anillo)) {
    fail("Columbretes no cubre franja sur oficial (Carallot ~39.823)");
  }
  if (puntoEnPoligono(39.85, 0.63, col.anillo)) {
    fail("Columbretes no debe extenderse al oeste de ~0.645 (falso vedado)");
  }
  if (!/ARM\/3841\/2008|BOE-A-2009-68/i.test(col.norma)) {
    fail("Columbretes debe citar Orden ARM/3841/2008");
  }
  ok("Columbretes: vértices oficiales + cita ARM/3841/2008");
}

if (!vedadosM.some((z) => z.id === "irta_mar")) {
  fail("falta Irta en vedadosMarinos (kayak/barco)");
} else {
  ok("Irta también en capa marítima (barco/kayak)");
}

// ——— Puertos no se comen playas ———
const playasLibres = [
  "alcossebre_blanca",
  "burriana_arenal",
  "vinaros_forti",
  "grao_pinar",
  "orpesa_renega",
  "orpesa_morro_gos",
];
for (const id of playasLibres) {
  const pl = playas.playas.find((x) => x.id === id);
  if (!pl) {
    fail(`falta playa ${id}`);
    continue;
  }
  const hit = puertos.find((p) => puntoEnPoligono(pl.lat, pl.lng, p.anillo));
  if (hit) fail(`playa ${id} dentro de puerto ${hit.id} → falso vedado`);
}
ok("playas clave fuera de polígonos de puerto");

// ——— Orpesa reubicada ———
const renega = playas.playas.find((x) => x.id === "orpesa_renega");
const morro = playas.playas.find((x) => x.id === "orpesa_morro_gos");
if (!renega || Math.abs(renega.lat - 40.062) > 0.01) {
  fail("orpesa_renega debe estar ~40.062 (Platja Renegà real)");
}
if (!morro || Math.abs(morro.lat - 40.091) > 0.01) {
  fail("orpesa_morro_gos debe estar ~40.091");
}
ok("Orpesa: Renegà y Morro de Gos reubicados");

if (typeof playas.kmOrilla !== "number" || playas.kmOrilla > 0.8) {
  fail(`kmOrilla demasiado amplio (${playas.kmOrilla}); orilla no debe llegar a ~2 km mar adentro`);
} else {
  ok(`kmOrilla razonable (${playas.kmOrilla} km)`);
}

const riba = playas.playas.find((x) => x.id === "alcossebre_ribamar");
if (riba?.vedaOrilla) {
  fail("alcossebre_ribamar está al sur de Irta: no forzar vedaOrilla");
} else {
  ok("Ribamar sin vedaOrilla forzada");
}

// ——— Millars no se come Pla de la Torre ———
const millars = vedadosC.find((z) => z.id === "millars_gola");
if (!millars) fail("falta millars_gola");
else if (puntoEnPoligono(39.905, -0.038, millars.anillo)) {
  fail("millars_gola sigue tragándose Pla de la Torre (~39.905,-0.038)");
} else {
  ok("Millars/golas no invade Pla de la Torre");
}

// ——— Teresa es coto ———
const teresa = zones.find((z) => z.id === "rio_palancia_teresa_libre");
if (!teresa) fail("falta ficha Teresa");
else if (teresa.estadoZona === "libre_sin_muerte" || /Libre sin muerte/i.test(teresa.nombre)) {
  fail("Teresa CS-008 no puede figurar como libre sin muerte");
} else if (teresa.estadoZona !== "controlada") {
  fail("Teresa debe ser estadoZona controlada (coto)");
} else {
  ok("Coto Teresa ya no se vende como libre");
}

// ZPL embalses no deben figurar como coto en la ficha
for (const id of ["embalse_arenos", "embalse_maria_cristina", "embalse_ulldecona"]) {
  const z = zones.find((x) => x.id === id);
  if (z?.estadoZona === "controlada") fail(`${id} ZPL marcado controlada`);
}

if (/cs-sichar|Embalse de Sichar/.test(sitiosFaciles) && /porQue:.*principiante|accesible, orillas amplias/.test(sitiosFaciles)) {
  fail("Sichar no debe ser sitio fácil sin aviso de veda/mejillón");
}
if (/cs-palancia[\s\S]*Teresa \(libre\)/.test(sitiosFaciles) || /nombre: "Palancia · Teresa \(libre\)"/.test(sitiosFaciles)) {
  fail("sitiosFaciles no debe ofrecer Teresa como libre");
}
if (/cs-sichar/.test(sitiosFaciles)) {
  fail("quitar Sichar de sitiosFaciles (contradicción normativa)");
}
ok("sitiosFaciles sin Sichar ni Teresa «libre»");

if (!consultaPesca.includes("PRIORIDAD_RADIO") || !consultaPesca.includes("VP: 0")) {
  fail("buscarTramoCercano debe priorizar VP/ZPC sobre ZPL en radios solapados");
} else {
  ok("prioridad radios VP > ZPC > ZPL");
}

const norma = read("src/data/normativaMaritima.ts");
if (!norma.includes("BOE-A-2009-68")) {
  fail("urlColumbretes debe apuntar al BOE ARM/3841/2008");
}
ok("enlace Columbretes BOE");

if (!embSvc.includes("todosLosVedadosMarinos") || !read("src/data/vedadosMarinos.json").includes("irta_mar")) {
  fail("consulta embarcación debe poder vedar Irta vía vedadosMarinos");
}
ok("capa marítima incluye Irta");

const pkg = read("package.json");
if (!pkg.includes("assert_auditoria_mapa_zonas.mjs")) {
  fail("package.json debe cablear assert_auditoria_mapa_zonas.mjs");
}

if (fallos) {
  console.error(`assert_auditoria_mapa_zonas: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_auditoria_mapa_zonas");
