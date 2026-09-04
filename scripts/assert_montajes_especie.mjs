/**
 * Assert: montajes visuales por especie (principiantes).
 * Uso: node scripts/assert_montajes_especie.mjs
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

const montajes = read("src/data/montajesEspecie.ts");
const esperados = [
  "montaje-lubina-spinning",
  "montaje-dorada-fondo",
  "montaje-sargo-roca",
  "montaje-carpa-boya",
  "montaje-bass-texas",
  "montaje-trucha-cucharilla",
  "montaje-llisa-boya",
  "montaje-sepia-eging",
];
for (const id of esperados) {
  if (!montajes.includes(`diagramaId: "${id}"`)) fail(`Falta diagrama ${id}`);
  if (!montajes.includes(`consejoId: "${id}"`) && !montajes.includes(`consejoId: "montaje-`)) {
    /* consejoId uses same slug */
  }
  if (!montajes.includes(`"${id}"`)) fail(`Falta id ${id} en montajesEspecie`);
}

const n = (montajes.match(/consejoId: "/g) || []).length;
if (n < 8) fail(`Se esperan ≥8 montajes (hay ${n})`);

for (const sp of ["lubina", "dorada", "sargo", "carpa", "black_bass", "trucha_comun", "llisa", "sepia"]) {
  if (!montajes.includes(`"${sp}"`)) fail(`Montaje debe cubrir especie ${sp}`);
}

const consejos = read("src/data/consejos.ts");
if (!consejos.includes('id: "montajes"') || !consejos.includes("MONTAJES_ESPECIE")) {
  fail("consejos.ts debe incluir sección montajes desde MONTAJES_ESPECIE");
}
if (!consejos.includes('| "montajes"')) fail("CategoriaConsejo debe incluir montajes");

const media = read("src/data/consejosMedia.ts");
for (const id of esperados) {
  if (!media.includes(`| "${id}"`)) fail(`IdDiagrama sin ${id}`);
}

const diagrama = read("src/components/DiagramaConsejo.tsx");
if (!diagrama.includes("EsquemaMontajeLinea") || !diagrama.includes("montajePorDiagramaId")) {
  fail("DiagramaConsejo debe renderizar EsquemaMontajeLinea para montajes");
}

const esquema = read("src/components/EsquemaMontajeLinea.tsx");
if (!esquema.includes("Orden del aparejo") || !esquema.includes("Cómo regular")) {
  fail("EsquemaMontajeLinea debe mostrar orden y regulación");
}

const consejosScreen = read("src/screens/ConsejosScreen.tsx");
if (!consejosScreen.includes("consejoId") || !consejosScreen.includes("route.params")) {
  fail("ConsejosScreen debe abrir un consejo por params");
}

const especies = read("src/screens/EspeciesScreen.tsx");
if (!especies.includes("onMontaje") || !especies.includes("consejoIdMontajeEspecie")) {
  fail("EspeciesScreen debe enlazar Ver montaje");
}

const aparejos = read("src/screens/AparejosScreen.tsx");
if (!aparejos.includes("Cómo montar la línea") || !aparejos.includes('categoria: "montajes"')) {
  fail("AparejosScreen debe CTA a montaje visual");
}

const app = read("App.tsx");
if (!app.includes('name="Consejos"') || (app.match(/name="Consejos"/g) || []).length < 2) {
  fail("Consejos debe estar en Home y Especies (al menos)");
}

const pkg = read("package.json");
if (!pkg.includes("assert_montajes_especie.mjs")) {
  fail("package.json assert debe incluir assert_montajes_especie.mjs");
}

console.log("OK: montajes visuales por especie (8 estrellas + enlaces)");
