/**
 * Assert: Salgo a pescar es el CTA grande de Inicio; «siguiente paso» es apoyo.
 * Lenguaje amateur: no «checklist» en textos de UI visibles.
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
  "Revisa qué llevar",
  "Registrar salida de hoy",
  "irAChecklist",
  "total === 0",
]) {
  if (!card.includes(n)) fail(`SiguientePasoCard sin ${n}`);
}
if (card.includes("Termina el checklist") || card.includes("Continuar checklist")) {
  fail("SiguientePasoCard no debe mostrar la palabra «checklist» al usuario");
}

const home = read("src/screens/HomeScreen.tsx");
if (!home.includes("ctaSalgoTitle") || !home.includes(">Salgo a pescar<")) {
  fail("Home debe mostrar el CTA grande «Salgo a pescar»");
}
if (!home.includes("<SiguientePasoCard") || !home.includes("irAChecklist")) {
  fail("Home debe conservar SiguientePasoCard (salida de hoy / apoyo)");
}
const iSalgo = home.indexOf("ctaSalgoTitle");
const iPaso = home.indexOf("<SiguientePasoCard");
if (!(iSalgo >= 0 && iPaso > iSalgo)) {
  fail("El CTA Salgo a pescar debe ir antes de SiguientePasoCard");
}

const salgo = read("src/screens/SalgoAPescarScreen.tsx");
for (const n of [
  "guardarSalidaHoy",
  "Registrar salida de hoy",
  "irAChecklist",
  "notaSalida",
  "Qué llevar",
]) {
  if (!salgo.includes(n)) fail(`SalgoAPescar sin ${n}`);
}
if (salgo.includes("Ir al checklist") || salgo.includes("3 · Checklist")) {
  fail("SalgoAPescar no debe mostrar «checklist» al usuario");
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
