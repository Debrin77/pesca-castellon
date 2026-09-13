/**
 * Assert: pines del mapa continental usan el semáforo de HOY
 * (no solo el tipo ZPL/ZPC), para no mostrar verde si la ficha dice HOY NO.
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
for (const k of ["aspectoMapaTramo", "colorMarcadorTramo", "colorSemaforo", "sePuedePescarHoy"]) {
  if (!svc.includes(k)) fail(`consultaPescaService falta ${k}`);
}
if (!svc.includes("consultarPorTramo(t, fecha)")) {
  fail("aspectoMapaTramo debe basarse en consultarPorTramo");
}

const zonas = read("src/screens/ZonasLibresScreen.tsx");
if (!zonas.includes("aspectoMapaTramo")) {
  fail("ZonasLibresScreen debe colorear pines con aspectoMapaTramo");
}
if (zonas.includes("colorAprovechamiento(")) {
  fail("ZonasLibresScreen no debe colorear tramos solo por aprovechamiento");
}

const especies = read("src/screens/EspeciesScreen.tsx");
if (!especies.includes("aspectoMapaTramo")) {
  fail("EspeciesScreen debe colorear pines con aspectoMapaTramo");
}
if (especies.includes("colorAprovechamiento(")) {
  fail("EspeciesScreen no debe colorear tramos solo por aprovechamiento");
}

const leyenda = read("src/components/LeyendaMapa.tsx");
for (const k of ["Hoy sí", "Hoy no", "temporada y días hábiles"]) {
  if (!leyenda.includes(k)) fail(`LeyendaMapa falta «${k}»`);
}

const capa = read("src/components/CapaPoligonosIcv.tsx");
if (!capa.includes("colorMarcadorTramo")) {
  fail("CapaPoligonosIcv ZPL debe alinearse con semáforo de hoy");
}

const pkg = read("package.json");
if (!pkg.includes("assert_mapa_semaforo_hoy.mjs")) {
  fail("package.json assert debe incluir assert_mapa_semaforo_hoy.mjs");
}

// Datos: Palancia puente Teresa (p17.4) es ZPL salmonícola → fuera de temporada = HOY NO
const tramos = JSON.parse(read("src/data/tramosOficiales.json"));
const p174 = tramos.find((t) => t.id === "p17.4");
if (!p174) fail("falta tramo p17.4");
else {
  if (p174.aprovechamiento !== "ZPL") fail("p17.4 debe ser ZPL");
  if (!/salmon/i.test(p174.vocacion || "")) fail("p17.4 debe ser salmonícola");
}

const normativa = read("src/data/normativa2026.ts");
if (!normativa.includes("temporadaTruchaAbierta") || !normativa.includes("7, 31")) {
  fail("temporada trucha debe cerrar el 31 de agosto");
}

if (fallos) {
  console.error(`assert_mapa_semaforo_hoy: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_mapa_semaforo_hoy");
