/**
 * Assert: 5 mejoras UX — recomendación, FAB captura, Maps/acceso, glosario, aire.
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

const home = read("src/screens/HomeScreen.tsx");
const catches = read("src/screens/MyCatchesScreen.tsx");
const zone = read("src/screens/ZoneDetailScreen.tsx");
const glosario = read("src/data/glosario.ts");
const termino = read("src/components/TerminoAyuda.tsx");
const rec = read("src/components/RecomendacionHoyCard.tsx");
const accesos = read("src/data/accesosZonas.ts");
const maps = read("src/utils/abrirEnMaps.ts");
const avisos = read("src/components/PanelAvisosSeguridad.tsx");
const campo = read("src/components/PanelCampoHoy.tsx");
const consejos = read("src/data/consejos.ts");

if (!home.includes("<RecomendacionHoyCard") || !rec.includes("Hoy te conviene")) {
  fail("Inicio sin recomendación «Hoy te conviene»");
}
if (!home.includes("antesAbierto") || !home.includes("setAntesAbierto")) {
  fail("Inicio sin «Antes de salir» plegable");
}
if (!home.includes("abrirCapturaRapida")) {
  fail("Inicio sin atajo a captura rápida");
}
if (!catches.includes("fabCaptura") || !catches.includes("tomarFotoCamara")) {
  fail("Capturas sin FAB / cámara rápida");
}
if (!catches.includes("abrirCapturaRapida")) {
  fail("Capturas sin param abrirCapturaRapida");
}
if (!zone.includes("abrirEnMaps") || !zone.includes("Cómo llegar")) {
  fail("Ficha zona sin Cómo llegar / Maps");
}
if (!accesos.includes("accesoDeZona") || !maps.includes("abrirEnMaps")) {
  fail("Faltan accesosZonas / abrirEnMaps");
}
if (!glosario.includes("solunar") || !glosario.includes("saih") || !termino.includes("Glosario")) {
  fail("Glosario / TerminoAyuda incompleto");
}
if (!campo.includes("TerminoAyuda")) {
  fail("PanelCampoHoy sin tip glosario");
}
if (!avisos.includes("compacto")) {
  fail("PanelAvisosSeguridad sin modo compacto");
}
if (!consejos.includes("voc-solunar") || !consejos.includes("voc-sm")) {
  fail("Consejos vocabulario sin solunar / SM");
}

if (fallos) {
  console.error(`assert_ux5_mejoras: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_ux5_mejoras");
