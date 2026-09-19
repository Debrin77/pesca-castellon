/**
 * Assert: diagrama gráfico de medición (de dónde a dónde) en fichas de especie.
 * Uso: node scripts/assert_diagrama_medicion.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function fail(msg) {
  console.error("FAIL:", msg);
  process.exit(1);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const criterio = read("src/data/criterioMedicion.ts");
for (const token of [
  "PatronMedicion",
  "pez_total",
  "pez_horquilla",
  "cefalopodo_manto",
  "pulpo_peso",
  "cangrejo_caparazon",
  "criterioMedicionDe",
  "Longitud total",
  "1967/2006",
]) {
  if (!criterio.includes(token)) fail(`criterioMedicion.ts debe incluir ${token}`);
}
if (/dorada:\s*PEZ_HORQUILLA/.test(criterio)) {
  fail("Dorada debe medirse en longitud total (Anexo IV), no horquilla");
}

const diagrama = read("src/components/DiagramaMedicion.tsx");
for (const token of [
  "Cómo medir",
  "criterio.desde",
  "criterio.hasta",
  "longitud_total_noaa",
  "NOAA",
  "longitud total (TL)",
  "etiquetaPatron",
  "CotaConFlechas",
]) {
  if (!diagrama.includes(token)) fail(`DiagramaMedicion.tsx debe incluir ${token}`);
}
if (diagrama.includes("soloLeyenda")) {
  fail("DiagramaMedicion ya no usa soloLeyenda (flechas sobre foto retiradas)");
}
if (diagrama.includes("function Silueta") || /pezCuerpo|pulpoCabeza|cangrejoCap/.test(diagrama)) {
  fail("DiagramaMedicion no debe usar siluetas cutres");
}

const assetNoaa = path.join(root, "assets/medicion/longitud_total_noaa.jpg");
if (!fs.existsSync(assetNoaa)) {
  fail("Falta assets/medicion/longitud_total_noaa.jpg (diagrama técnico NOAA)");
}

// No overlays A/B sobre fotos de especie (poco fiables en fotos reales).
if (fs.existsSync(path.join(root, "src/components/FotoConMedicion.tsx"))) {
  fail("FotoConMedicion.tsx debe eliminarse: no hay flechas sobre fotos de especie");
}
if (fs.existsSync(path.join(root, "src/data/anclasMedicionFoto.ts"))) {
  fail("anclasMedicionFoto.ts debe eliminarse: no hay anclas sobre fotos");
}

const tarjeta = read("src/components/TarjetaEspecie.tsx");
if (!tarjeta.includes("DiagramaMedicion") || !tarjeta.includes("criterioMedicionDe")) {
  fail("TarjetaEspecie debe renderizar DiagramaMedicion cuando hay talla medible");
}
if (tarjeta.includes("FotoConMedicion") || tarjeta.includes("hayAnclaMedicionFoto")) {
  fail("TarjetaEspecie no debe usar overlays A/B sobre la foto");
}

const aparejos = read("src/screens/AparejosScreen.tsx");
if (!aparejos.includes("DiagramaMedicion") || !aparejos.includes("criterioMedicionDe")) {
  fail("AparejosScreen debe mostrar DiagramaMedicion en la ficha de especie");
}
if (aparejos.includes("FotoConMedicion") || aparejos.includes("hayAnclaMedicionFoto")) {
  fail("AparejosScreen no debe usar overlays A/B sobre la foto");
}

// Cobertura: especies con tallaCm/tallaKg deben resolver criterio
const orilla = JSON.parse(read("src/data/especiesOrilla.json"));
const conTalla = (orilla.pescablesOrilla || []).filter(
  (sp) => (sp.tallaCm != null && Number.isFinite(sp.tallaCm)) || (sp.tallaKg != null && Number.isFinite(sp.tallaKg))
);
if (conTalla.length < 8) fail(`Se esperan ≥8 pescables orilla con talla numérica (hay ${conTalla.length})`);

const species = JSON.parse(read("src/data/species.json"));
const continentalConTalla = species.filter((sp) => sp.tallaCm != null && Number.isFinite(sp.tallaCm));
if (continentalConTalla.length < 1) fail("Debe haber al menos una especie continental con tallaCm");

console.log("OK assert_diagrama_medicion:", {
  orillaConTalla: conTalla.length,
  continentalConTalla: continentalConTalla.map((s) => s.id),
  patrones: ["pez_total", "pez_horquilla", "cefalopodo_manto", "pulpo_peso", "cangrejo_caparazon"],
  diagrama: "NOAA Fish Length (TL destacado)",
});
