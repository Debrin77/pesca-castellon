/**
 * Smoke: «Salgo a pescar» permite elegir ubicación (GPS / mapa / coords / zona).
 * Uso: node scripts/assert_salgo_ubicacion.mjs
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

const salgo = read("src/screens/SalgoAPescarScreen.tsx");
for (const needle of [
  "iniciarPickUbicacion",
  'motivoPick: "salgo"',
  "parsearLatLng",
  "usarGps",
  "irAMapa",
  "aplicarCoordsManual",
  "fijarPunto",
  "consultarToqueMapa",
  "Cambiar ubicación",
  "Usar estas coordenadas",
  "Zonas de",
  "Dónde estás",
]) {
  if (!salgo.includes(needle)) fail(`SalgoAPescarScreen no incluye ${needle}`);
}

// No debe bloquearse solo con GPS fallido
if (/Necesitas activar la ubicación para este modo/.test(salgo)) {
  fail("Salgo a pescar no debe bloquearse solo si falla el GPS");
}

const pendiente = read("src/services/ubicacionPendiente.ts");
if (!/"salgo"/.test(pendiente)) fail("ubicacionPendiente debe incluir motivo salgo");

const mapa = read("src/screens/ZonasLibresScreen.tsx");
for (const needle of [
  "usarUbicacionParaSalgo",
  'motivoPick === "salgo"',
  "Dónde vas a pescar",
  "confirmarPickSiProcede",
  "pickSalgo",
  "Usar esta ubicación",
]) {
  if (!mapa.includes(needle)) fail(`ZonasLibresScreen no incluye ${needle}`);
}

// El CTA de confirmar debe poder verse fuera de la ficha (pie) y al inicio de la ficha.
if (!mapa.includes("pickConfirmar && marcador")) {
  fail("Mapa en modo salgo debe mostrar «Usar esta ubicación» con el marcador (sin depender solo del final de la ficha)");
}

const home = read("src/screens/HomeScreen.tsx");
if (!home.includes("consultarToqueMapa")) {
  fail("Inicio debe consultar con consultarToqueMapa (costa + continental)");
}

const pkg = read("package.json");
if (!pkg.includes("assert_salgo_ubicacion.mjs")) {
  fail("package.json assert debe incluir assert_salgo_ubicacion.mjs");
}

console.log("OK: Salgo a pescar · GPS / mapa / coords / zona");
