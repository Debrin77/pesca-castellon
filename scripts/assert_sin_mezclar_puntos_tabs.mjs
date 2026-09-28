/**
 * Assert: Especies/Mapa no mezclan un punto restaurado ni un embalse con kayak mar.
 * Arranque limpio; el «Último» de Inicio es el camino para reactivar.
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

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const especies = read("src/screens/EspeciesScreen.tsx");
for (const n of [
  "puntoElegido",
  "esMarConsultaEmbarcacion",
  "limpiarSeleccionLocal",
  "mismatch:",
  "Arranque limpio",
  "forzar",
]) {
  if (!especies.includes(n)) fail(`EspeciesScreen sin ${n}`);
}

// No sembrar el mapa con el punto restaurado (sin puntoElegido).
if (/const puntoSeed\s*=/.test(especies) || /consultaSeed/.test(especies)) {
  fail("EspeciesScreen no debe sembrar consulta/marcador desde punto restaurado (puntoSeed)");
}
if (!especies.includes("if (!puntoElegido) return")) {
  fail("Especies debe exigir puntoElegido para hidratar el punto compartido");
}
if (!especies.includes("pedidoExplicito")) {
  fail("Especies debe respetar «Ver especies de este punto» (pedidoExplicito)");
}

const mapa = read("src/screens/ZonasLibresScreen.tsx");
if (!mapa.includes("esMarConsultaEmbarcacion")) {
  fail("Mapa debe evitar reinterpretar pin continental como kayak/barco");
}
if (!mapa.includes("Solo muestra «yo»") && !mapa.includes("no marca consulta automática")) {
  fail("Mapa no debe auto-marcar consulta al arrancar con GPS");
}
// El mount GPS ya no debe setConsulta/setMarcador automáticamente.
if (/obtenerUbicacionActual\(\)[\s\S]{0,400}setConsulta\(c\)/.test(mapa)) {
  fail("Mapa no debe setConsulta al obtener GPS en el mount");
}

const home = read("src/screens/HomeScreen.tsx");
if (!home.includes("puntoAnterior") || !home.includes("Último ·")) {
  fail("Inicio debe conservar «Último · …» como reactivación del punto");
}

const pkg = read("package.json");
if (!pkg.includes("assert_sin_mezclar_puntos_tabs.mjs")) {
  fail("package.json assert debe incluir assert_sin_mezclar_puntos_tabs.mjs");
}

if (fallos) {
  console.error(`assert_sin_mezclar_puntos_tabs: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_sin_mezclar_puntos_tabs");
