/**
 * Assert: siguiente paso único en Inicio + registro Salida de hoy.
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

const svc = read("src/services/salidaHoyService.ts");
for (const n of ["leerSalidaHoy", "guardarSalidaHoy", "checklistCompleta", "veredictoTexto"]) {
  if (!svc.includes(n)) fail(`salidaHoyService sin ${n}`);
}

const card = read("src/components/SiguientePasoCard.tsx");
for (const n of [
  "sin_sitios",
  "sin_punto",
  "checklist",
  "registrar",
  "hecha",
  "Guarda tu primer sitio",
  "Termina el checklist",
  "Registrar salida de hoy",
  "irAChecklist",
  "total === 0",
]) {
  if (!card.includes(n)) fail(`SiguientePasoCard sin ${n}`);
}

const home = read("src/screens/HomeScreen.tsx");
if (!home.includes("<SiguientePasoCard") || !home.includes("irAChecklist")) {
  fail("Home debe usar SiguientePasoCard como CTA principal");
}

const salgo = read("src/screens/SalgoAPescarScreen.tsx");
for (const n of [
  "guardarSalidaHoy",
  "Registrar salida de hoy",
  "irAChecklist",
  "notaSalida",
]) {
  if (!salgo.includes(n)) fail(`SalgoAPescar sin ${n}`);
}

const pkg = read("package.json");
if (!pkg.includes("assert_siguiente_paso_salida_hoy.mjs")) {
  fail("package.json assert debe incluir assert_siguiente_paso_salida_hoy.mjs");
}

if (fallos) {
  console.error(`assert_siguiente_paso_salida_hoy: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_siguiente_paso_salida_hoy");
