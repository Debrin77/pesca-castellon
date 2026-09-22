/**
 * Assert: top 3 sitios por especie (presencia + pulso) en ficha Especies.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let fallos = 0;
function fail(m) {
  console.error("FAIL", m);
  fallos++;
}
function read(r) {
  return fs.readFileSync(path.join(root, r), "utf8");
}

const util = read("src/utils/recomendacionPorEspecie.ts");
for (const n of [
  "elegirTopSitiosPorEspecie",
  "candidatosContinental",
  "candidatosOrilla",
  "orientativoSinCatalogo",
  "PREF_TIPO",
  "carpin",
  "calcularIndicePesca",
  "calcularIndiceBarco",
  "todasLasPlayas",
  "todasLasRampas",
]) {
  if (!util.includes(n)) fail(`recomendacionPorEspecie sin ${n}`);
}

const ui = read("src/components/TopSitiosEspecie.tsx");
for (const n of [
  "3 sitios hoy",
  "elegirTopSitiosPorEspecie",
  "Sitios hoy",
  "onAbrir",
  "autoAbrir",
  "ORDINALES",
  "StyleSheet.create",
]) {
  if (!ui.includes(n)) fail(`TopSitiosEspecie sin ${n}`);
}

const esp = read("src/screens/EspeciesScreen.tsx");
for (const n of [
  "TopSitiosEspecie",
  "bloqueSitiosEspecie",
  "abrirSitioEspecie",
  "anclaSitios",
  "extra={bloqueSitiosEspecie",
  "busquedaCatalogo",
  "autoSitiosRio",
  "autoAbrir",
  'navigate("License")',
  'navigate("Aparejos")',
]) {
  if (!esp.includes(n)) fail(`EspeciesScreen sin ${n}`);
}

const pkg = read("package.json");
if (!pkg.includes("assert_recomendacion_por_especie.mjs")) {
  fail("package.json assert debe incluir assert_recomendacion_por_especie.mjs");
}

if (fallos) {
  console.error(`assert_recomendacion_por_especie: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_recomendacion_por_especie");
