/**
 * Assert: novedades tipo Fishing Points (sin login Google/Facebook ni sync nube).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
let fallos = 0;
function fail(msg) {
  console.error("FAIL", msg);
  fallos++;
}
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

// Catálogo ampliado
const iconosSrc = read("src/data/iconosPunto.ts");
const nColores = (iconosSrc.match(/\{\s*id:\s*"/g) || []).length;
// Rough: count COLORES vs ICONOS by splitting sections
const coloresBlock = iconosSrc.slice(
  iconosSrc.indexOf("export const COLORES_PUNTO"),
  iconosSrc.indexOf("export const ICONOS_PUNTO")
);
const iconosBlock = iconosSrc.slice(iconosSrc.indexOf("export const ICONOS_PUNTO"));
const nC = (coloresBlock.match(/id:\s*"/g) || []).length;
const nI = (iconosBlock.match(/id:\s*"/g) || []).length;
if (nC < 10) fail(`COLORES_PUNTO debe tener ≥10 (tiene ${nC})`);
if (nI < 40) fail(`ICONOS_PUNTO debe tener ≥40 (tiene ${nI})`);
else console.log(`OK iconos ${nI} · colores ${nC}`);

for (const n of [
  "compartirUbicacion",
  "urlMapsCompartible",
  "GraficoPrecipitacion",
  "urlPlantillaRadar",
  "frameConTipo",
  "windStreak",
  "Buscar por nombre o notas",
  "Por color",
  "Por icono",
  "varios puntos",
  "radarScrub",
  "capas.capturas",
  "mm · intensidad",
  "precipitacionMm",
]) {
  // search across key files
}

const abrir = read("src/utils/abrirEnMaps.ts");
if (!abrir.includes("compartirUbicacion") || !abrir.includes("urlMapsCompartible")) {
  fail("abrirEnMaps debe exponer compartirUbicacion + urlMapsCompartible");
}

const precip = read("src/components/GraficoPrecipitacion.tsx");
for (const n of ["intensidad", "probabilidad", "rafagaKmh", "Toca"]) {
  if (!precip.includes(n)) fail(`GraficoPrecipitacion sin ${n}`);
}

const prev = read("src/screens/PrevisionScreen.tsx");
if (!prev.includes("GraficoPrecipitacion")) fail("PrevisionScreen sin GraficoPrecipitacion");
if (!prev.includes("rafagaKmh") || !prev.includes("precipitacionMm")) {
  fail("PrevisionScreen debe mostrar ráfaga e intensidad");
}
if (!prev.includes("vientoKmh={dia?.vientoMaxKmh}")) {
  fail("AtmosferaMeteo debe recibir viento/ráfaga");
}

const atmosfera = read("src/components/AtmosferaMeteo.tsx");
if (!atmosfera.includes("windStreak") || !atmosfera.includes("hayViento")) {
  fail("AtmosferaMeteo necesita animación de viento");
}

const radar = read("src/services/radarService.ts");
if (!radar.includes("urlPlantillaRadar") || !radar.includes("frameConTipo")) {
  fail("radarService sin helpers de scrubber");
}

const mapa = read("src/screens/ZonasLibresScreen.tsx");
for (const n of ["radarScrub", "urlPlantillaRadar", "varios puntos", "capas.capturas", "Reiniciar"]) {
  if (!mapa.includes(n)) fail(`ZonasLibresScreen sin ${n}`);
}

const capturas = read("src/screens/MyCatchesScreen.tsx");
for (const n of [
  "Buscar por nombre o notas",
  "Por color",
  "Por icono",
  "compartirUbicacion",
  "Compartir enlace",
  "etiquetaColorPunto",
]) {
  if (!capturas.includes(n)) fail(`MyCatchesScreen sin ${n}`);
}

const sheet = read("src/components/GuardarPuntoSheet.tsx");
if (!sheet.includes("Compartir enlace del punto") || !sheet.includes("ICONOS_PUNTO.length")) {
  fail("GuardarPuntoSheet debe listar iconos ampliados y compartir");
}

const meteo = read("src/services/weatherService.ts");
if (!meteo.includes("precipitacionMm") || !meteo.includes("Tormenta fuerte")) {
  fail("detectarAlertas debe contemplar precipitación / tormenta fuerte");
}

const pkg = read("package.json");
if (!pkg.includes("assert_fishing_points_novedades.mjs")) {
  fail("package.json assert debe incluir assert_fishing_points_novedades.mjs");
}

if (fallos) {
  console.error(`assert_fishing_points_novedades: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_fishing_points_novedades");
