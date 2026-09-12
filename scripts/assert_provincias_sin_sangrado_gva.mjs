/**
 * Assert: Sevilla/Córdoba/Cuenca no reciben textos solo-GVA / solo-Sevilla incorrectos.
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
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const consulta = read("src/services/consultaPescaService.ts");
if (consulta.includes("En Sevilla no hay cotos") && !consulta.includes('idProv === "sevilla"')) {
  fail("consultaPesca: texto solo-Sevilla sin ramificar por provincia");
}
if (!consulta.includes("esProvinciaCastillaLaMancha") || !consulta.includes("Orden 20/2026")) {
  fail("consultaPesca: Cuenca/CLM debe citar Orden 20/2026, no solo Orden 30/2016");
}
if (!consulta.includes("avisosPorNotaAnexoCordoba")) {
  fail("consultaPesca: Córdoba debe usar avisosPorNotaAnexoCordoba (Anexo V.2 Iznájar)");
}

const lic = read("src/screens/LicenseScreen.tsx");
if (lic.includes('"Seguro de pescador (Castellón)"') && !lic.includes("esClm")) {
  fail("LicenseScreen: seguro Castellón hardcodeado sin rama CLM");
}
if (!lic.includes("JCCM") && !lic.includes("Castilla-La Mancha")) {
  fail("LicenseScreen: falta rama CLM en textos de licencia");
}

const sev = read("src/provincias/sevilla/normativa.ts");
const cor = read("src/provincias/cordoba/normativa.ts");
for (const [n, txt] of [
  ["sevilla", sev],
  ["cordoba", cor],
]) {
  if (!txt.includes("9.4") || !/cebar|cebado/i.test(txt)) {
    fail(`${n}: REGLAS deben citar art. 9.4 (no cebar / pez-cebo)`);
  }
}
if (!cor.includes("IZNAJAR") && !cor.includes("ANEXO_V_2")) {
  fail("cordoba normativa: falta Anexo V.2 / Iznájar");
}

const tramos = read("src/provincias/cordoba/tramosOficiales.json");
if (!tramos.includes('"notaAnexo": "ANEXO_V_2"')) {
  fail("Iznájar debe tener notaAnexo ANEXO_V_2");
}

const rec = read("src/data/recomendacionesAparejo.ts");
if (!rec.includes("ANDALUCIA_NO_CEBAR") || !rec.includes("ANDALUCIA_SILURO_NO_OBJETO")) {
  fail("recomendacionesAparejo: faltan restricciones Andalucía no-cebar / siluro");
}

const ovSev = read("src/provincias/sevilla/speciesOverrides.json");
const ovCor = read("src/provincias/cordoba/speciesOverrides.json");
for (const [n, txt] of [
  ["sevilla", ovSev],
  ["cordoba", ovCor],
]) {
  if (txt.includes("Carassius auratus")) fail(`${n}: carpín debe ser Carassius gibelio`);
}

if (fallos) {
  console.error(`assert_provincias_sin_sangrado_gva: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_provincias_sin_sangrado_gva");
