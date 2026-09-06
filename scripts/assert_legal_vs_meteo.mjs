/**
 * Assert: separación clara normativa (¿puedo?) vs clima (¿pinta?).
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

const ejes = read("src/data/ejesLegalMeteo.ts");
for (const n of [
  "NORMATIVA",
  "CLIMA",
  "¿Puedo pescar aquí?",
  "pinta el día",
  "no es el clima",
  "no autoriza a pescar",
  "tituloCorto",
  "indexLabel",
]) {
  if (!ejes.includes(n)) fail(`ejesLegalMeteo sin ${n}`);
}

const sem = read("src/components/SemaforoVeredicto.tsx");
if (!sem.includes("EJE_LEGAL")) fail("SemaforoVeredicto debe usar EJE_LEGAL");
if (!sem.includes("EJE_LEGAL.aviso")) fail("SemaforoVeredicto debe mostrar EJE_LEGAL.aviso");

const ejeComp = read("src/components/EjeLegalMeteo.tsx");
if (!ejeComp.includes("EJE_LEGAL") || !ejeComp.includes("EJE_METEO")) {
  fail("EjeLegalMeteo debe usar ambos ejes");
}

const home = read("src/screens/HomeScreen.tsx");
for (const n of ["EjeLegalMeteo", 'eje="meteo"', "EJE_LEGAL", "EJE_METEO", "indexLabel", "tituloCorto"]) {
  if (!home.includes(n)) fail(`HomeScreen sin ${n}`);
}
if (home.includes(">Índice de pesca<")) {
  fail("Home no debe mostrar «Índice de pesca» sin eje clima");
}

const salgo = read("src/screens/SalgoAPescarScreen.tsx");
for (const n of ["EjeLegalMeteo", 'eje="legal"', 'eje="meteo"', "Normativa", "Condiciones · clima"]) {
  if (!salgo.includes(n)) fail(`SalgoAPescarScreen sin ${n}`);
}
if (salgo.includes('["Ubicación", "Veredicto", "Checklist"]')) {
  fail("Salgo no debe mezclar veredicto legal con clima en los pasos");
}

const prev = read("src/screens/PrevisionScreen.tsx");
if (!prev.includes("EJE_METEO")) fail("PrevisionScreen sin EJE_METEO");
if (!prev.includes("no es permiso legal")) {
  fail("PrevisionScreen debe aclarar que el índice no es permiso legal");
}

const pkg = read("package.json");
if (!pkg.includes("assert_legal_vs_meteo.mjs")) {
  fail("package.json assert debe incluir assert_legal_vs_meteo.mjs");
}

if (fallos) {
  console.error(`assert_legal_vs_meteo: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_legal_vs_meteo");
