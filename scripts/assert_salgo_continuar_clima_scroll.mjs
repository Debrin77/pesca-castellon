/**
 * Assert: «Continuar → clima» / «Qué llevar» deben avanzar el paso Y
 * desplazar el scroll. Sin scroll, el bloque nuevo queda bajo una card
 * larga de normativa y parece que el CTA no hace nada (bug continental).
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

for (const n of [
  "irAlPaso",
  "scrollAlFinalPendiente",
  "onContentSizeChange",
  "scrollToEnd",
  "Continuar → clima",
  "Qué llevar →",
  "irAlPaso(1)",
  "irAlPaso(2)",
]) {
  if (!salgo.includes(n)) fail(`SalgoAPescarScreen sin «${n}»`);
}

// No dejar CTAs de avance con setPaso a secas (sin scroll).
if (/onPress=\{\(\)\s*=>\s*setPaso\(1\)\}/.test(salgo)) {
  fail("Continuar → clima no debe usar setPaso(1) directo sin irAlPaso/scroll");
}
if (/onPress=\{\(\)\s*=>\s*setPaso\(2\)\}/.test(salgo)) {
  fail("Qué llevar no debe usar setPaso(2) directo sin irAlPaso/scroll");
}

const pkg = read("package.json");
if (!pkg.includes("assert_salgo_continuar_clima_scroll.mjs")) {
  fail("package.json assert debe incluir assert_salgo_continuar_clima_scroll.mjs");
}

if (fallos) {
  console.error(`assert_salgo_continuar_clima_scroll: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_salgo_continuar_clima_scroll");
