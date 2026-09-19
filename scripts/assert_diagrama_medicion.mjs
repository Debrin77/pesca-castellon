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
  "dorada",
  "Longitud total",
]) {
  if (!criterio.includes(token)) fail(`criterioMedicion.ts debe incluir ${token}`);
}

const diagrama = read("src/components/DiagramaMedicion.tsx");
for (const token of [
  "Cómo medir",
  "criterio.desde",
  "criterio.hasta",
  "Flecha",
  "CotaConFlechas",
  "etiquetaPatron",
  "chipA",
  "chipB",
]) {
  if (!diagrama.includes(token)) fail(`DiagramaMedicion.tsx debe incluir ${token}`);
}
if (diagrama.includes("function Silueta") || /pezCuerpo|pulpoCabeza|cangrejoCap/.test(diagrama)) {
  fail("DiagramaMedicion no debe usar siluetas cutres; solo flechas de cota A→B");
}

const tarjeta = read("src/components/TarjetaEspecie.tsx");
if (!tarjeta.includes("DiagramaMedicion") || !tarjeta.includes("criterioMedicionDe")) {
  fail("TarjetaEspecie debe renderizar DiagramaMedicion cuando hay talla medible");
}

const aparejos = read("src/screens/AparejosScreen.tsx");
if (!aparejos.includes("DiagramaMedicion") || !aparejos.includes("criterioMedicionDe")) {
  fail("AparejosScreen debe mostrar DiagramaMedicion en la ficha de especie");
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
});
