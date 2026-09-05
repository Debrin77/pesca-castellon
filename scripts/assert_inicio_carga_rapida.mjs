/**
 * Inicio: pulso (clima + índice) no debe dejar al usuario esperando en vacío.
 * - Caché al instante (también online / antes de puntoListo)
 * - Refresco en paralelo (no bloquear por avisos/SAIH/notificaciones)
 * - GPS con last-known
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

const home = read("src/screens/HomeScreen.tsx");
for (const needle of [
  "antes incluso de puntoListo",
  "Stale-while-revalidate",
  "actualizando",
  "silencioso",
  "cargarAvisos",
  "Actualizando…",
  "setCargando(false)",
]) {
  if (!home.includes(needle)) fail(`HomeScreen sin ${needle}`);
}

if (!home.includes("Promise.all") || !home.includes("cargarAvisos()")) {
  fail("HomeScreen debe cargar pulso en paralelo con avisos/SAIH");
}

if (!home.includes("void (async () => {") || !home.includes("solicitarPermisoNotificaciones")) {
  fail("Notificaciones no deben bloquear el hero del pulso");
}

if (!home.includes("cargando && !clima && !indiceHoy")) {
  fail("El spinner del hero solo debe mostrarse si aún no hay pulso");
}

const loc = read("src/services/locationService.ts");
if (!loc.includes("getLastKnownPositionAsync")) {
  fail("locationService debe usar getLastKnownPositionAsync para un GPS rápido");
}
if (!loc.includes("maximumAge: 60_000") && !loc.includes("maximumAge: 60000")) {
  fail("GPS web debe aceptar posición reciente (maximumAge)");
}

const clima = read("src/services/weatherService.ts");
if (!clima.includes("memoClima") || !clima.includes("TTL_CLIMA_MS")) {
  fail("weatherService debe cachear clima en memoria");
}

const indice = read("src/services/fishingIndexService.ts");
if (!indice.includes("memoIndice") || !indice.includes("TTL_INDICE_MS")) {
  fail("fishingIndexService debe cachear índice en memoria");
}

const pkg = read("package.json");
if (!pkg.includes("assert_inicio_carga_rapida.mjs")) {
  fail("package.json assert debe incluir assert_inicio_carga_rapida.mjs");
}

console.log("OK: Inicio · pulso rápido (caché + paralelo + GPS last-known)");
