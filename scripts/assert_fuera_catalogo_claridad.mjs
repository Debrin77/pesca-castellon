/**
 * Assert: «SIN TRAMO» no se confunde con veda; cobertura cartográfica por provincia.
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

const types = read("src/provincias/types.ts");
for (const n of [
  "coberturaCartografica",
  "fueraCatalogoPermisos",
  "fueraCatalogoPrecauciones",
  "prohibiciones",
  "aguasLibres",
]) {
  if (!types.includes(n)) fail(`types.ts sin ${n}`);
}

const cs = read("src/provincias/castellon/config.ts");
for (const n of [
  "coberturaCartografica",
  "No es veda automática",
  "anexo I",
  "polígono ICV",
  "urlVisor",
]) {
  if (!cs.includes(n)) fail(`castellon/config sin ${n}`);
}

const se = read("src/provincias/sevilla/config.ts");
for (const n of [
  "coberturaCartografica",
  "art. 5.2",
  "No es veda automática",
  "DERA",
  "urlVisor",
]) {
  if (!se.includes(n)) fail(`sevilla/config sin ${n}`);
}

const svc = read("src/services/consultaPescaService.ts");
for (const n of [
  "Sin tramo en el catálogo",
  "coberturaCartografica",
  "fueraCatalogoPermisos",
  "fueraCatalogoPrecauciones",
]) {
  if (!svc.includes(n)) fail(`consultaPescaService sin ${n}`);
}
if (svc.includes("Fuera de tramo cartografiado") || svc.includes("Fuera de tramo cartografiado")) {
  fail("consultaPescaService aún usa el título confuso «Fuera de tramo cartografiado»");
}

const sem = read("src/components/SemaforoVeredicto.tsx");
for (const n of ["SIN TRAMO", "No es veda", "art. 5.2 puede aplicar", "fuera del catálogo"]) {
  if (!sem.includes(n)) fail(`SemaforoVeredicto sin ${n}`);
}

const cert = read("src/data/certezaConsulta.ts");
for (const n of ['fuenteGeometria === "ninguna"', "No es veda automática", "Art. 5.2"]) {
  if (!cert.includes(n)) fail(`certezaConsulta sin ${n}`);
}

const card = read("src/components/ConsultaPescaCard.tsx");
for (const n of ["coberturaBox", "Cobertura del mapa", "coberturaCartografica"]) {
  if (!card.includes(n)) fail(`ConsultaPescaCard sin ${n}`);
}

const lic = read("src/screens/LicenseScreen.tsx");
for (const n of [
  "Cartografía · qué está cubierto",
  "Prohibiciones declaradas",
  "Aguas libres / cauces",
  "coberturaCartografica",
]) {
  if (!lic.includes(n)) fail(`LicenseScreen sin ${n}`);
}

const onb = read("src/screens/OnboardingScreen.tsx");
if (!onb.includes("SIN TRAMO") || !onb.includes("no es veda automática")) {
  fail("OnboardingScreen no explica SIN TRAMO ≠ veda");
}

const glo = read("src/data/glosario.ts");
for (const n of ["sin_tramo", "art52", "No es veda automática"]) {
  if (!glo.includes(n)) fail(`glosario sin ${n}`);
}

const pkg = read("package.json");
if (!pkg.includes("assert_fuera_catalogo_claridad.mjs")) {
  fail("package.json assert debe incluir assert_fuera_catalogo_claridad.mjs");
}

if (fallos) {
  console.error(`assert_fuera_catalogo_claridad: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_fuera_catalogo_claridad");
