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
for (const token of ["Cómo medir", "PlacaMedicionEspecie", "especieId", "etiquetaPatron"]) {
  if (!diagrama.includes(token)) fail(`DiagramaMedicion.tsx debe incluir ${token}`);
}
if (diagrama.includes("soloLeyenda")) {
  fail("DiagramaMedicion ya no usa soloLeyenda");
}
if (diagrama.includes("longitud_total_noaa") || /NOAA Fisheries/.test(diagrama)) {
  fail("DiagramaMedicion debe usar placas por especie en español, no NOAA genérico");
}

const placa = read("src/components/PlacaMedicionEspecie.tsx");
for (const token of ["diagramaMedicionEspecie", "Longitud total", "Norma UE / RD 560", "placaImg"]) {
  if (!placa.includes(token)) fail(`PlacaMedicionEspecie.tsx debe incluir ${token}`);
}

const catalog = read("src/data/diagramasMedicionEspecie.ts");
for (const id of ["lubina", "dorada", "llisa", "salema", "caballa", "sargo", "pulpo"]) {
  if (!catalog.includes(`${id}:`)) fail(`Falta diagrama de medición para ${id}`);
}

const dir = path.join(root, "assets/medicion/especies");
for (const id of ["lubina", "dorada", "llisa", "salema", "caballa", "sargo", "mojarra", "jurel", "salmonete", "boga", "pulpo"]) {
  const jpg = path.join(dir, `${id}.jpg`);
  if (!fs.existsSync(jpg)) fail(`Falta asset ${id}.jpg`);
}

if (fs.existsSync(path.join(root, "src/components/FotoConMedicion.tsx"))) {
  fail("FotoConMedicion.tsx debe eliminarse");
}

const tarjeta = read("src/components/TarjetaEspecie.tsx");
if (!tarjeta.includes("especieId={sp.id}")) fail("TarjetaEspecie debe pasar especieId");
const aparejos = read("src/screens/AparejosScreen.tsx");
if (!aparejos.includes("especieId={sp?.id}")) fail("AparejosScreen debe pasar especieId");

const pkg = JSON.parse(read("package.json"));
if (!pkg.dependencies?.["react-native-svg"]) fail("Falta react-native-svg");

const orilla = JSON.parse(read("src/data/especiesOrilla.json"));
const conTalla = (orilla.pescablesOrilla || []).filter(
  (sp) => (sp.tallaCm != null && Number.isFinite(sp.tallaCm)) || (sp.tallaKg != null && Number.isFinite(sp.tallaKg))
);
if (conTalla.length < 8) fail(`Se esperan ≥8 pescables orilla con talla (hay ${conTalla.length})`);

console.log("OK assert_diagrama_medicion:", {
  orillaConTalla: conTalla.length,
  placasEspecie: fs.readdirSync(dir).length,
});
