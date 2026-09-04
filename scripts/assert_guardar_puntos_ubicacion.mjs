/**
 * Smoke: guardar puntos por GPS / mapa / coordenadas en ambas provincias.
 * Uso: node scripts/assert_guardar_puntos_ubicacion.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function fail(msg) {
  console.error("FAIL:", msg);
  process.exit(1);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const coords = read("src/services/coordsUtils.ts");
if (!/export function parsearLatLng/.test(coords)) fail("coordsUtils debe exportar parsearLatLng");
if (!/lat < -90 || lat > 90/.test(coords)) fail("parsearLatLng debe validar rango de latitud");
if (!/!latStr \|\| !lngStr/.test(coords) && !/Introduce latitud y longitud/.test(coords)) {
  fail("parsearLatLng debe rechazar campos vacíos");
}
if (!/aNumero/.test(coords)) fail("parsearLatLng debe parsear con aNumero (no Number vacío → 0)");

const pendiente = read("src/services/ubicacionPendiente.ts");
if (!/iniciarPickUbicacion/.test(pendiente)) fail("falta iniciarPickUbicacion");
if (!/consumirPickUbicacion/.test(pendiente)) fail("falta consumirPickUbicacion");
if (!/motivo: MotivoUbicacionPendiente/.test(pendiente) && !/MotivoUbicacionPendiente/.test(pendiente)) {
  fail("ubicacionPendiente debe tipar motivo punto|captura");
}

const catches = read("src/screens/MyCatchesScreen.tsx");
for (const needle of [
  "handleGuardarPuntoGps",
  "handleGuardarPuntoCoords",
  "irAMapaParaPunto",
  "irAMapaParaCaptura",
  "anadirUbicacionCapturaGps",
  "aplicarCoordsCapturaManual",
  "parsearLatLng",
  "provincia.nombre",
  'motivoPick: "punto"',
  'motivoPick: "captura"',
]) {
  if (!catches.includes(needle) && !new RegExp(needle).test(catches)) {
    fail(`MyCatchesScreen no incluye ${needle}`);
  }
}

const mapa = read("src/screens/ZonasLibresScreen.tsx");
for (const needle of [
  "modoAnadirPunto",
  "guardarMarcadorComoPunto",
  "usarUbicacionParaCaptura",
  "centrarEn",
  "Guardar este punto",
  "Usar esta ubicación",
  "bannerAnadir",
]) {
  if (!mapa.includes(needle)) fail(`ZonasLibresScreen no incluye ${needle}`);
}

// Debe poder guardar aunque no haya tramo (cualquier marcador)
if (!/consulta\.tramo \|\| consulta\.ambito === "maritimo" \|\| marcador/.test(mapa)) {
  fail("Guardar punto debe estar disponible con cualquier marcador, no solo tramo/costa");
}

const storage = read("src/services/storageService.ts");
if (!/provinciaId: getProvinciaIdActiva\(\)/.test(storage)) {
  fail("guardarPunto debe etiquetar provincia activa (ambas provincias)");
}
if (!/@pesca_app\/\$\{id\}\/puntos_guardados/.test(storage) && !/puntos_guardados/.test(storage)) {
  fail("puntos_guardados deben estar namespaced por provincia");
}

const pkg = read("package.json");
if (!pkg.includes("assert_guardar_puntos_ubicacion.mjs")) {
  fail("package.json assert debe incluir assert_guardar_puntos_ubicacion.mjs");
}

console.log("OK: guardar puntos por GPS / mapa / coordenadas (ambas provincias)");
