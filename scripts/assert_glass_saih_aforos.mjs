/**
 * Assert: Liquid Glass en Inicio/Mapa + aforos SAIH CHJ por provincia.
 * Uso: node scripts/assert_glass_saih_aforos.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let fallos = 0;
function fail(m) {
  console.error("FAIL:", m);
  fallos++;
}
function ok(m) {
  console.log("OK:", m);
}
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}
function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

if (!exists("src/components/GlassCard.tsx")) fail("falta GlassCard.tsx");
else ok("GlassCard");

const glass = read("src/components/GlassCard.tsx");
for (const n of [
  "BlurView",
  "backdropFilter",
  "compacto",
  "oscuro",
  "expo-blur",
  "esFondoTransparente",
  "partirEstilo",
]) {
  if (!glass.includes(n)) fail(`GlassCard sin ${n}`);
}
// El style del caller con backgroundColor transparent no debe pisar el velo glass.
if (!/esFondoTransparente[\s\S]*delete chrome\.backgroundColor/.test(glass)) {
  fail("GlassCard debe ignorar backgroundColor transparent del style");
} else ok("GlassCard no anula velo con transparent");

const home = read("src/screens/HomeScreen.tsx");
const explorar = read("src/components/PanelExplorarSitios.tsx");
for (const n of ["import GlassCard", "<GlassCard"]) {
  if (!home.includes(n)) fail(`HomeScreen sin ${n}`);
}
for (const n of [
  "getResumenAforos",
  "aforoPanel",
  "saihAforos",
  "Aforos · caudal",
  "setAforoPanel",
]) {
  if (!explorar.includes(n)) fail(`PanelExplorarSitios sin ${n}`);
}
const mapaMount = read("src/screens/ZonasLibresScreen.tsx");
if (!mapaMount.includes("PanelExplorarSitios")) {
  fail("Mapa debe montar PanelExplorarSitios (aforos/embalses fuera de Inicio)");
}
ok("HomeScreen glass + aforos en Mapa/PanelExplorarSitios");

const mapa = read("src/screens/ZonasLibresScreen.tsx");
for (const n of [
  "import GlassCard",
  "<GlassCard",
  "</GlassCard>",
  "modoBarKayak",
  "searchInputMar",
]) {
  if (!mapa.includes(n)) fail(`ZonasLibres sin ${n}`);
}
// Contraste costa/barco: el input no puede ser texto blanco sobre glass semitransparente.
if (/searchInputMar:\s*\{[^}]*color:\s*["']#fff["']/s.test(mapa)) {
  fail("searchInputMar no debe usar color #fff (ilegible sobre waterLight)");
}
if (mapa.includes('placeholderTextColor={mar ? "rgba(255,255,255')) {
  fail("placeholder del buscador en mar no debe ser blanco semitransparente");
}
if (/oscuro=\{mar\}/.test(mapa)) {
  fail("GlassCard del mapa no debe usar oscuro={mar} sobre fondo waterLight");
}
if (!mapa.includes("COLORS.waterDark") || !/searchInputMar:[\s\S]*?color:\s*COLORS\.waterDark/.test(mapa)) {
  fail("searchInputMar debe usar color oscuro legible (COLORS.waterDark)");
}
ok("ZonasLibres contraste buscador mar");
// No debe quedar el searchBox abierto como View sin cerrar GlassCard correctamente
const openGlass = (mapa.match(/<GlassCard\b/g) || []).length;
const closeGlass = (mapa.match(/<\/GlassCard>/g) || []).length;
if (openGlass < 4) fail(`ZonasLibres debería usar ≥4 GlassCard (tiene ${openGlass})`);
if (openGlass !== closeGlass) fail(`GlassCard sin equilibrar: ${openGlass} abiertos / ${closeGlass} cierres`);
ok(`ZonasLibres glass (${openGlass})`);

const saih = read("src/services/saihService.ts");
for (const n of [
  "getResumenAforos",
  "parsearAforoChj",
  "SAIH_CHJ_AFOROS_URL",
  "NivelAforo",
  "aforoSimulado",
  "saih.chj.es/aforos",
  "objetivo.length >= 8",
  'fuente: "cache"',
  "guardarUltimoEmbalse",
  "guardarUltimoAforo",
  "leerUltimoEmbalse",
  "leerUltimoAforo",
  "etiquetaFuenteSaih",
  "esFuenteSaihReal",
]) {
  if (!saih.includes(n)) fail(`saihService sin ${n}`);
}
ok("saihService aforos + último dato cacheado");

const explorarUi = read("src/components/PanelExplorarSitios.tsx");
for (const n of ["metaFuentePanel", "etiquetaFuenteSaih", "esFuenteSaihReal", "fechaDato"]) {
  if (!explorarUi.includes(n)) fail(`PanelExplorarSitios sin ${n}`);
}
ok("PanelExplorarSitios muestra último/fecha");

const tipos = read("src/provincias/types.ts");
if (!tipos.includes("AforoPanelMeta") || !tipos.includes("aforosPanel")) {
  fail("types.ts sin AforoPanelMeta / aforosPanel");
} else ok("types aforosPanel");

const cs = read("src/provincias/castellon/config.ts");
if (!cs.includes("aforosPanel") || !cs.includes("EA 145 SALIDA DE ARENÓS")) {
  fail("castellon config sin aforos CHJ");
} else ok("castellón aforos");

const cu = read("src/provincias/cuenca/config.ts");
if (!cu.includes("aforosPanel") || !cu.includes("EA 107 SALIDA ALARCÓN")) {
  fail("cuenca config sin aforos CHJ");
}
if (!cu.includes("EMBALSE DE LA TOBA")) fail("cuenca sin embalse La Toba");
else ok("cuenca aforos + La Toba");

const se = read("src/provincias/sevilla/config.ts");
const co = read("src/provincias/cordoba/config.ts");
if (!se.includes("aforosPanel: []")) fail("sevilla debe declarar aforosPanel vacío (CHG sin HTML)");
if (!co.includes("aforosPanel: []")) fail("cordoba debe declarar aforosPanel vacío (CHG sin HTML)");
ok("sevilla/córdoba aforos vacíos");

const offline = read("src/services/offlineService.ts");
if (!offline.includes("saihAforos")) fail("offlineService sin saihAforos");
else ok("cache offline aforos");

const glosario = read("src/data/glosario.ts");
if (!glosario.includes("aforo:") && !glosario.includes("id: \"aforo\"")) {
  fail("glosario sin término aforo");
} else ok("glosario aforo");

const web = read("src/webChrome.ts");
if (!web.includes("pesca-glass")) fail("webChrome sin clase pesca-glass");
else ok("webChrome pesca-glass");

const pkg = read("package.json");
if (!pkg.includes("assert_glass_saih_aforos.mjs")) {
  fail("package.json assert debe incluir assert_glass_saih_aforos.mjs");
}

const readme = read("README.md");
if (!/Aforos fluviales|Liquid Glass/i.test(readme)) {
  fail("README debe mencionar aforos / Liquid Glass");
} else ok("README actualizado");

if (fallos) {
  console.error(`assert_glass_saih_aforos: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_glass_saih_aforos");
