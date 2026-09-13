/**
 * Assert: pines del mapa (continental y costa) usan el semáforo de HOY,
 * no solo el tipo de zona (ZPL/playa/puerto), para no mostrar verde si la ficha dice HOY NO.
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

const svc = read("src/services/consultaPescaService.ts");
for (const k of ["aspectoMapaTramo", "colorMarcadorTramo", "colorSemaforo", "sePuedePescarHoy", "periodoTruchaCuencaAbierto", "trucheraClm"]) {
  if (!svc.includes(k)) fail(`consultaPescaService falta ${k}`);
}
if (!svc.includes("consultarPorTramo(t, fecha)")) {
  fail("aspectoMapaTramo debe basarse en consultarPorTramo");
}

const costaSvc = read("src/services/consultaCostaService.ts");
for (const k of ["aspectoMapaPlaya", "aspectoMapaZonaCostaProhibida", "colorSemaforo", "vedaOrilla"]) {
  if (!costaSvc.includes(k)) fail(`consultaCostaService falta ${k}`);
}

for (const screen of ["src/screens/ZonasLibresScreen.tsx", "src/screens/EspeciesScreen.tsx"]) {
  const src = read(screen);
  if (!src.includes("aspectoMapaTramo")) fail(`${screen} debe colorear tramos con aspectoMapaTramo`);
  if (!src.includes("aspectoMapaPlaya")) fail(`${screen} debe colorear playas con aspectoMapaPlaya`);
  if (!src.includes("aspectoMapaZonaCostaProhibida")) fail(`${screen} debe colorear puertos/vedados con aspectoMapaZonaCostaProhibida`);
  if (src.includes("colorAprovechamiento(")) fail(`${screen} no debe colorear tramos solo por aprovechamiento`);
  if (/pinColor=\{PIN\.playa\}/.test(src)) fail(`${screen} no debe fijar playas a PIN.playa`);
  if (/pinColor=\{PIN\.puerto\}/.test(src)) fail(`${screen} no debe fijar puertos a PIN.puerto`);
}

const leyenda = read("src/components/LeyendaMapa.tsx");
for (const k of ["Hoy sí", "Hoy no", "si puedes hoy"]) {
  if (!leyenda.includes(k)) fail(`LeyendaMapa falta «${k}»`);
}
if (leyenda.includes('label: "Playa"')) fail("Leyenda costa no debe usar categoría Playa como color de semáforo");
const zonas = read("src/screens/ZonasLibresScreen.tsx");
if (zonas.includes("Pin de agua") || zonas.includes("Gris = puerto")) {
  fail("ZonasLibresScreen no debe explicar pines de costa por categoría (playa/puerto)");
}
if (!zonas.includes("hoy sí en orilla") && !zonas.includes("Verde = hoy sí")) {
  fail("ZonasLibresScreen debe explicar color = si puedes hoy");
}

const capa = read("src/components/CapaPoligonosIcv.tsx");
if (!capa.includes("colorMarcadorTramo")) {
  fail("CapaPoligonosIcv ZPL debe alinearse con semáforo de hoy");
}

const puertos = read("src/components/CapaPuertos.tsx");
if (!puertos.includes("SEMAFORO.no") && !puertos.includes("PIN.vedado")) {
  fail("CapaPuertos debe usar color de HOY NO (rojo), no gris de categoría");
}

const pkg = read("package.json");
if (!pkg.includes("assert_mapa_semaforo_hoy.mjs")) {
  fail("package.json assert debe incluir assert_mapa_semaforo_hoy.mjs");
}

const tramos = JSON.parse(read("src/data/tramosOficiales.json"));
const p174 = tramos.find((t) => t.id === "p17.4");
if (!p174) fail("falta tramo p17.4");
else {
  if (p174.aprovechamiento !== "ZPL") fail("p17.4 debe ser ZPL");
  if (!/salmon/i.test(p174.vocacion || "")) fail("p17.4 debe ser salmonícola");
}

const playas = JSON.parse(read("src/data/playasEspigonesCosta.json"));
const conVeda = (playas.playas || []).filter((p) => p.vedaOrilla);
if (conVeda.length < 1) fail("debe haber playas con vedaOrilla para colorear HOY NO");

const normativa = read("src/data/normativa2026.ts");
if (!normativa.includes("temporadaTruchaAbierta") || !normativa.includes("7, 31")) {
  fail("temporada trucha debe cerrar el 31 de agosto");
}

if (fallos) {
  console.error(`assert_mapa_semaforo_hoy: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_mapa_semaforo_hoy");
