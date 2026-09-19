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
  "soloLeyenda",
]) {
  if (!diagrama.includes(token)) fail(`DiagramaMedicion.tsx debe incluir ${token}`);
}
if (diagrama.includes("function Silueta") || /pezCuerpo|pulpoCabeza|cangrejoCap/.test(diagrama)) {
  fail("DiagramaMedicion no debe usar siluetas cutres; solo flechas de cota A→B");
}

const fotoMed = read("src/components/FotoConMedicion.tsx");
for (const token of ["FotoConMedicion", "proyectarCover", "OverlayLinea", "mín."]) {
  if (!fotoMed.includes(token)) fail(`FotoConMedicion.tsx debe incluir ${token}`);
}

const anclas = read("src/data/anclasMedicionFoto.ts");
for (const id of ["lubina", "dorada", "pulpo", "sargo", "llisa", "jurel"]) {
  if (!anclas.includes(`${id}:`)) fail(`Falta ancla calibrada para ${id}`);
}

const tarjeta = read("src/components/TarjetaEspecie.tsx");
if (!tarjeta.includes("DiagramaMedicion") || !tarjeta.includes("criterioMedicionDe")) {
  fail("TarjetaEspecie debe renderizar DiagramaMedicion cuando hay talla medible");
}
if (!tarjeta.includes("FotoConMedicion") || !tarjeta.includes("hayAnclaMedicionFoto")) {
  fail("TarjetaEspecie debe anclar flechas A→B sobre la foto cuando hay ancla");
}

const aparejos = read("src/screens/AparejosScreen.tsx");
if (!aparejos.includes("DiagramaMedicion") || !aparejos.includes("criterioMedicionDe")) {
  fail("AparejosScreen debe mostrar DiagramaMedicion en la ficha de especie");
}
if (!aparejos.includes("FotoConMedicion")) {
  fail("AparejosScreen debe mostrar FotoConMedicion con flechas sobre la foto");
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
