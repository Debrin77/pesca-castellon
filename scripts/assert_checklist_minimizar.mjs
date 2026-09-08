/**
 * Assert: «Qué llevar» se puede minimizar (no cerrar) con resumen de progreso.
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

const salgo = read("src/screens/SalgoAPescarScreen.tsx");
const check = read("src/components/ChecklistInteractivo.tsx");

for (const n of [
  "CLAVE_CHECKLIST_MINIMIZADO",
  "checklistMinimizado",
  "alternarChecklistMinimizado",
  "checklistProgreso",
  "Minimizar ▴",
  "listos · toca para abrir",
  "onProgresoChecklist",
  "minimizado={checklistMinimizado}",
]) {
  if (!salgo.includes(n)) fail(`SalgoAPescarScreen sin ${n}`);
}

// Abrir a propósito debe expandir (no dejar minimizado)
if (!salgo.includes('AsyncStorage.setItem(CLAVE_CHECKLIST_MINIMIZADO, "0")')) {
  fail("SalgoAPescarScreen: abrir Qué llevar debe expandir (clave = 0)");
}
if (!salgo.includes("setChecklistMinimizado(false)")) {
  fail("SalgoAPescarScreen: irAlChecklistUi / CTAs deben expandir la lista");
}

for (const n of ["minimizado", "onProgreso", "if (minimizado) return null"]) {
  if (!check.includes(n)) fail(`ChecklistInteractivo sin ${n}`);
}

const pkg = read("package.json");
if (!pkg.includes("assert_checklist_minimizar.mjs")) {
  fail("package.json assert debe incluir assert_checklist_minimizar.mjs");
}

if (fallos) {
  console.error(`assert_checklist_minimizar: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_checklist_minimizar");
