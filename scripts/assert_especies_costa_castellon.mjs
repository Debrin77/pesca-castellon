/**
 * Assert: Castellón puede seleccionar las 15 especies de costa más usuales.
 * Uso: node scripts/assert_especies_costa_castellon.mjs
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

const orilla = JSON.parse(read("src/data/especiesOrilla.json"));
const usuales = orilla.usualesIds;
if (!Array.isArray(usuales) || usuales.length !== 15) {
  fail(`usualesIds debe tener exactamente 15 ids (tiene ${usuales?.length})`);
}

const esperadas = [
  "lubina",
  "dorada",
  "sargo",
  "mojarra",
  "herrera",
  "oblada",
  "salema",
  "llisa",
  "mabra",
  "jurel",
  "caballa",
  "sepia",
  "calamar",
  "pulpo",
  "salmonete",
];
for (const id of esperadas) {
  if (!usuales.includes(id)) fail(`Falta usual ${id}`);
  if (!orilla.pescablesOrilla.some((s) => s.id === id)) fail(`usual ${id} no está en pescablesOrilla`);
}

const svc = read("src/services/catalogoEspeciesService.ts");
for (const needle of [
  "especiesOrillaUsuales",
  "especiesOrillaParaSeleccion",
  "catalogoParaModalidad",
  "resolverEspecie",
  "USUALES_ORILLA_IDS",
]) {
  if (!svc.includes(needle)) fail(`catalogoEspeciesService sin ${needle}`);
}

const catches = read("src/screens/MyCatchesScreen.tsx");
if (!catches.includes("catalogoParaModalidad") || !catches.includes("catalogoSeleccion")) {
  fail("MyCatchesScreen debe seleccionar especies según modalidad (incl. costa)");
}
if (!catches.includes("resolverEspecie")) {
  fail("MyCatchesScreen debe resolver especies de costa en capturas guardadas");
}
if (catches.includes("{speciesCatalog.map((s: any) => (")) {
  fail("MyCatchesScreen no debe listar solo speciesCatalog continental en el formulario");
}

const especies = read("src/screens/EspeciesScreen.tsx");
if (!especies.includes("especiesOrillaParaSeleccion")) {
  fail("EspeciesScreen catálogo mar debe usar las 15 usuales");
}
if (!especies.includes('cambiarModo("costa")') && !especies.includes("cambiarModo(siguiente")) {
  fail("EspeciesScreen debe poder cambiar a modo costa");
}
if (!especies.includes("Costa (orilla)") || !especies.includes("Ver especies de orilla")) {
  fail("EspeciesScreen debe mostrar toggle Costa y botón Ver especies de orilla");
}
if (!especies.includes("abrirCatalogoOrilla") || !especies.includes('setCatalogo("mar")')) {
  fail("EspeciesScreen debe abrir el catálogo de orilla (mar) de forma directa");
}
if (!especies.includes("regionCosta") && !especies.includes("camaraCosta")) {
  fail("EspeciesScreen debe enfocar la costa al elegir modo costa");
}
if (!/costa &&\s*\n?\s*playas\.map/.test(especies) && !especies.includes("costa &&") ) {
  fail("EspeciesScreen debe mostrar playas en modo costa (sin esperar una consulta previa)");
}
// El modo costa no puede depender solo de consulta.ambito (antes las playas no aparecían nunca).
if (/const costa = !soloContinental && consulta\?\.ambito === "maritimo"/.test(especies)) {
  fail("EspeciesScreen: costa no debe depender solo de la consulta; usar modo Ríos/Costa");
}

const aparejos = read("src/screens/AparejosScreen.tsx");
if (!aparejos.includes("especiesOrillaParaSeleccion")) {
  fail("Aparejos costa debe usar las 15 usuales");
}

const castellon = read("src/provincias/castellon/config.ts");
if (!castellon.includes("continentalOnly: false")) {
  fail("Castellón debe permitir costa (continentalOnly: false)");
}

const pkg = read("package.json");
if (!pkg.includes("assert_especies_costa_castellon.mjs")) {
  fail("package.json assert debe incluir assert_especies_costa_castellon.mjs");
}

console.log("OK: Castellón · 15 especies de costa seleccionables");
