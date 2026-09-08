/**
 * Assert: radar de lluvia muestra hora/fecha («para cuándo» es la imagen).
 * Visible en placa sobre el mapa + banner del pie + chip.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
let fallos = 0;
function fail(msg) {
  console.error(`FAIL ${msg}`);
  fallos++;
}
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const svc = read("src/services/radarService.ts");
for (const n of [
  "frameActivo",
  "TipoFrameRadar",
  "elegirFrameActivo",
  "etiquetaCuandoRadar",
  "etiquetaHoraRadarCorta",
  "etiquetaTipoRadar",
  "etiquetaFechaRadarPlaca",
  "Observado a las",
  "Previsto para las",
  'tipo: "observado"',
  'tipo: "previsto"',
]) {
  if (!svc.includes(n)) fail(`radarService sin ${n}`);
}

const idxElegir = svc.indexOf("function elegirFrameActivo");
const idxPast = svc.indexOf("past.length", idxElegir);
const idxNowcast = svc.indexOf("nowcast.length", idxElegir);
if (idxElegir < 0 || idxPast < 0 || idxNowcast < 0 || !(idxPast < idxNowcast)) {
  fail("radarService debe preferir frame past (observado) antes que nowcast");
}

const mapa = read("src/screens/ZonasLibresScreen.tsx");
for (const n of [
  "radarFrame",
  "etiquetaCuandoRadar",
  "radarCuando",
  "radarPlaca",
  "radarPlacaHora",
  "radarBanner",
  "Radar ${radarHoraCorta}",
  "Para ${radarFechaPlaca}",
]) {
  if (!mapa.includes(n)) fail(`ZonasLibresScreen sin ${n}`);
}

const campo = read("src/components/PanelCampoHoy.tsx");
if (!campo.includes("Lluvia con hora")) {
  fail("PanelCampoHoy debe indicar que el radar muestra la hora");
}

const pkg = read("package.json");
if (!pkg.includes("assert_radar_hora_fecha.mjs")) {
  fail("package.json assert debe incluir assert_radar_hora_fecha.mjs");
}

if (fallos) {
  console.error(`assert_radar_hora_fecha: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_radar_hora_fecha");
