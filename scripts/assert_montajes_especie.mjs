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
  "montaje-jurel-cucharilla",
  "montaje-pulpo-fondo",
  "montaje-barbo-feeder",
  "montaje-siluro-spinning",
];
for (const id of esperados) {
  if (!montajes.includes(`diagramaId: "${id}"`)) fail(`Falta diagrama ${id}`);
  if (!montajes.includes(`"${id}"`)) fail(`Falta id ${id} en montajesEspecie`);
}

const n = (montajes.match(/consejoId: "/g) || []).length;
if (n < 12) fail(`Se esperan ≥12 montajes (hay ${n})`);

for (const sp of [
  "lubina",
  "dorada",
  "sargo",
  "carpa",
  "black_bass",
  "trucha_comun",
  "llisa",
  "sepia",
  "jurel",
  "pulpo",
  "barbo",
  "siluro",
]) {
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
if (!esquema.includes("fotoDePiezaMontaje") || !esquema.includes("FotoPieza")) {
  fail("EsquemaMontajeLinea debe usar foto real por elemento (no solo chips de color)");
}
if (!esquema.includes("expo-asset") || !esquema.includes('createElement("img"')) {
  fail("EsquemaMontajeLinea debe resolver URI con expo-asset y pintar <img> en web");
}

const piezasMedia = read("src/data/montajePiezasMedia.ts");
if (!piezasMedia.includes("fotoDePiezaMontaje") || !piezasMedia.includes("linea-nylon.jpg")) {
  fail("montajePiezasMedia debe mapear tipos de pieza a fotos locales");
}
for (const img of [
  "assets/consejos/aparejos/linea-nylon.jpg",
  "assets/consejos/aparejos/boyas.jpg",
  "assets/consejos/aparejos/boyas-stick.jpg",
  "assets/consejos/aparejos/cebo-gusano.jpg",
  "assets/consejos/aparejos/cebo-maiz.jpg",
  "assets/consejos/aparejos/egi-jigs.jpg",
]) {
  if (!fs.existsSync(path.join(root, img))) fail(`Falta foto de montaje ${img}`);
}
const attrib = read("assets/consejos/licencias/ATTRIBUTION.md");
for (const name of ["boyas.jpg", "linea-nylon.jpg", "cebo-gusano.jpg", "egi-jigs.jpg"]) {
  if (!attrib.includes(name)) fail(`ATTRIBUTION.md debe citar ${name}`);
}

const consejosScreen = read("src/screens/ConsejosScreen.tsx");
if (!consejosScreen.includes("consejoId") || !consejosScreen.includes("route.params")) {
  fail("ConsejosScreen debe abrir un consejo por params");
}
if (!consejosScreen.includes("montajesParaProvincia") || !consejosScreen.includes("TAGS_COSTA")) {
  fail("ConsejosScreen debe filtrar montajes/tips de costa según provincia");
}
if (!montajes.includes("montajesParaProvincia") || !montajes.includes("SILURO_NO_OBJETO")) {
  fail("montajesEspecie debe filtrar siluro no-objeto y costa continental");
}
if (!montajes.includes("barbo_gitano")) {
  fail("Montaje barbo debe cubrir barbo_gitano");
}
if (!montajes.includes("Andalucía art. 9.4") && !montajes.includes("art. 9.4")) {
  fail("Montaje carpa/barbo debe avisar art. 9.4 sin cebar");
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

const salgo = read("src/screens/SalgoAPescarScreen.tsx");
if (
  !salgo.includes("Ver montaje típico") ||
  !salgo.includes("consejoIdMontajeEspecie") ||
  !salgo.includes('categoria: "montajes"') ||
  !salgo.includes("onMontaje")
) {
  fail("SalgoAPescar debe deep-link a montaje típico de la especie destacada");
}

const card = read("src/components/ConsultaPescaCard.tsx");
if (!card.includes("onMontaje") || !card.includes("montajeDisponible")) {
  fail("ConsultaPescaCard debe exponer CTA Montaje cuando hay esquema");
}

const home = read("src/screens/HomeScreen.tsx");
if (!home.includes("onMontaje") || !home.includes("consejoIdMontajeEspecie")) {
  fail("Inicio debe enlazar montaje desde la consulta del tramo");
}

const mapa = read("src/screens/ZonasLibresScreen.tsx");
if (!mapa.includes("onMontaje") || !mapa.includes("consejoIdMontajeEspecie")) {
  fail("Mapa debe enlazar montaje desde la ficha de consulta");
}

const pkg = read("package.json");
if (!pkg.includes("assert_montajes_especie.mjs")) {
  fail("package.json assert debe incluir assert_montajes_especie.mjs");
}

const homeChip = read("src/screens/HomeScreen.tsx");
if (
  !(homeChip.includes('navigate("Consejos"') || homeChip.includes("irAConsejos(")) ||
  !homeChip.includes("Montajes")
) {
  fail("Inicio debe enlazar Consejos con etiqueta Montajes");
}


if (!montajes.includes("nudoId") || !montajes.includes("NUDO_ETIQUETA") || !montajes.includes("NudoMontajeId")) {
  fail("montajesEspecie debe tipar nudoId / NUDO_ETIQUETA por pieza");
}
const nudos = (montajes.match(/nudoId: "/g) || []).length;
if (nudos < 12) fail(`Se esperan ≥12 piezas con nudo recomendado (hay ${nudos})`);
for (const nid of ["nudo-palomar", "nudo-albright", "nudo-clinch"]) {
  if (!montajes.includes(`"${nid}"`)) fail(`Falta nudo ${nid} en montajes`);
  if (!consejos.includes(`id: "${nid}"`)) fail(`consejos.ts debe tener ${nid}`);
}
const esquemaNudo = read("src/components/EsquemaMontajeLinea.tsx");
if (!esquemaNudo.includes("nudoId") || !esquemaNudo.includes("NUDO_ETIQUETA") || !esquemaNudo.includes("Ver pasos")) {
  fail("EsquemaMontajeLinea debe mostrar nudo recomendado y enlace a pasos");
}
if (!esquemaNudo.includes("irAConsejos") || !esquemaNudo.includes('categoria: "nudos"')) {
  fail("EsquemaMontajeLinea debe deep-link al consejo del nudo");
}
if (!esquemaNudo.includes("FONT_SIZE")) {
  fail("EsquemaMontajeLinea debe usar FONT_SIZE del theme");
}
const theme = read("src/theme.ts");
if (!theme.includes("export const FONT_SIZE") || !theme.includes("md: 14")) {
  fail("theme.ts debe exportar FONT_SIZE con cuerpo ≥14");
}

console.log("OK: montajes visuales por especie (12 + nudos + tipografía + enlaces)");

