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
const idsOrilla = ["lubina", "dorada", "llisa", "salema", "caballa", "sargo", "pulpo"];
const idsMar = ["pagel", "denton", "sepia", "calamar", "corvina", "palometon", "anjova", "espeton"];
const idsContinental = [
  "trucha_comun",
  "trucha_arcoiris",
  "black_bass",
  "lucio",
  "carpa",
  "barbo",
  "tenca",
  "siluro",
  "mugilidos",
  "llobarro",
  "cangrejo_americano",
];
for (const id of [...idsOrilla, ...idsMar, ...idsContinental]) {
  if (!catalog.includes(`${id}:`)) fail(`Falta diagrama de medición para ${id}`);
}

const dir = path.join(root, "assets/medicion/especies");
for (const id of [...idsOrilla, ...idsMar, ...idsContinental]) {
  const jpg = path.join(dir, `${id}.jpg`);
  if (!fs.existsSync(jpg)) fail(`Falta asset ${id}.jpg`);
}

if (fs.existsSync(path.join(root, "src/components/FotoConMedicion.tsx"))) {
  fail("FotoConMedicion.tsx debe eliminarse");
}
if (fs.existsSync(path.join(root, "src/data/anclasMedicionFoto.ts"))) {
  fail("anclasMedicionFoto.ts debe eliminarse");
}

const tarjeta = read("src/components/TarjetaEspecie.tsx");
if (!tarjeta.includes("DiagramaMedicion") || !tarjeta.includes("criterioMedicionDe")) {
  fail("TarjetaEspecie debe renderizar DiagramaMedicion cuando hay talla medible");
}
if (!tarjeta.includes("especieId={sp.id}")) fail("TarjetaEspecie debe pasar especieId");
if (tarjeta.includes("FotoConMedicion") || tarjeta.includes("hayAnclaMedicionFoto")) {
  fail("TarjetaEspecie no debe usar overlays A/B sobre la foto");
}

const aparejos = read("src/screens/AparejosScreen.tsx");
if (!aparejos.includes("DiagramaMedicion") || !aparejos.includes("criterioMedicionDe")) {
  fail("AparejosScreen debe mostrar DiagramaMedicion en la ficha de especie");
}
if (!aparejos.includes("especieId={sp?.id}")) fail("AparejosScreen debe pasar especieId");
if (aparejos.includes("FotoConMedicion") || aparejos.includes("hayAnclaMedicionFoto")) {
  fail("AparejosScreen no debe usar overlays A/B sobre la foto");
}

const pkg = JSON.parse(read("package.json"));
if (!pkg.dependencies?.["react-native-svg"]) fail("Falta react-native-svg");

const orilla = JSON.parse(read("src/data/especiesOrilla.json"));
const conTalla = (orilla.pescablesOrilla || []).filter(
  (sp) =>
    (sp.tallaCm != null && Number.isFinite(sp.tallaCm)) ||
    (sp.tallaKg != null && Number.isFinite(sp.tallaKg))
);
if (conTalla.length < 8) fail(`Se esperan ≥8 pescables orilla con talla (hay ${conTalla.length})`);

const species = JSON.parse(read("src/data/species.json"));
const continentalConTalla = species.filter((sp) => sp.tallaCm != null && Number.isFinite(sp.tallaCm));
if (continentalConTalla.length < 1) fail("Debe haber al menos una especie continental con tallaCm");

const barco = JSON.parse(read("src/data/especiesEmbarcacion.json"));
const barcoConTalla = (barco.pescables || []).filter((sp) => sp.tallaCm != null && Number.isFinite(sp.tallaCm));
if (barcoConTalla.length < 4) fail(`Se esperan ≥4 pescables barco con talla (hay ${barcoConTalla.length})`);
for (const sp of barcoConTalla) {
  if (!fs.existsSync(path.join(dir, `${sp.id}.jpg`)) && !catalog.includes(`${sp.id}:`)) {
    fail(`Barco ${sp.id} con talla sin placa`);
  }
}

console.log("OK assert_diagrama_medicion:", {
  orillaConTalla: conTalla.length,
  barcoConTalla: barcoConTalla.map((s) => s.id),
  continentalConTalla: continentalConTalla.map((s) => s.id),
  placasEspecie: fs.readdirSync(dir).filter((f) => f.endsWith(".jpg")).length,
  cobertura: "orilla + mar/barco + continental",
});
