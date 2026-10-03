/**
 * Assert: pantalla Licencias con apartados plegables (sin omitir contenido).
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

const license = read("src/screens/LicenseScreen.tsx");
const apartado = read("src/components/ApartadoPlegable.tsx");

if (!license.includes('from "../components/ApartadoPlegable"')) {
  fail("LicenseScreen debe importar ApartadoPlegable");
}

for (const n of [
  "Normativa en vigor",
  "Cupos (catálogo",
  'titulo="Permisos de coto"',
  "Cartografía · qué está cubierto",
  "Mis licencias en este móvil",
  'titulo="Reglas generales"',
  'titulo="Antes de salir"',
  'titulo="Tallas y régimen por especie"',
  "inicialAbierto",
  "Toca cada apartado para leerlo",
]) {
  if (!license.includes(n)) fail(`LicenseScreen sin ${n}`);
}

// Secciones densas deben ir en ApartadoPlegable, no en tarjetas fijas abiertas
const cardsAbiertas = (license.match(/<View style=\{styles\.card\}>/g) || []).length;
if (cardsAbiertas > 0) {
  fail("LicenseScreen no debe usar styles.card fijas; usar ApartadoPlegable");
}

const usosPlegable = (license.match(/<ApartadoPlegable/g) || []).length;
if (usosPlegable < 8) {
  fail(`LicenseScreen debería tener varios ApartadoPlegable (tiene ${usosPlegable})`);
}

for (const n of ["subCerrado", "accessibilityState={{ expanded: abierto }}"]) {
  if (!apartado.includes(n)) fail(`ApartadoPlegable sin ${n}`);
}

// CTAs de trámite siguen visibles fuera de los plegables
for (const n of [
  "Tramitar licencia continental",
  "Consultar normativa / orden de vedas",
  "Consultar resolución de tramos (DOGV)",
]) {
  if (!license.includes(n)) fail(`LicenseScreen sin CTA/texto ${n}`);
}

const pkg = read("package.json");
if (!pkg.includes("assert_licencias_desplegables.mjs")) {
  fail("package.json assert debe incluir assert_licencias_desplegables.mjs");
}

if (fallos) {
  console.error(`assert_licencias_desplegables: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_licencias_desplegables");
