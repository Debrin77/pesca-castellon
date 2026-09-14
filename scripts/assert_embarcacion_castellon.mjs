/**
 * Assert: modalidad embarcación Castellón (legal, índice, catálogo, nav, ritual).
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
function ok(msg) {
  console.log(`OK ${msg}`);
}
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}
function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

for (const f of [
  "src/data/vedadosMarinos.json",
  "src/data/rampasEmbarcacion.json",
  "src/data/especiesEmbarcacion.json",
  "src/data/aparejosEmbarcacion.json",
  "src/services/consultaEmbarcacionService.ts",
  "src/services/boatIndexService.ts",
  "src/services/navegacionEmbarcacionService.ts",
  "src/screens/SalgoEnBarcoScreen.tsx",
  "src/components/CapaVedadosMarinos.tsx",
  "src/components/IndiceBarcoCard.tsx",
]) {
  if (!exists(f)) fail(`falta ${f}`);
  else ok(f);
}

const norma = read("src/data/normativaMaritima.ts");
if (!norma.includes("REGLAS_EMBARCACION_MAR")) fail("normativa sin REGLAS_EMBARCACION_MAR");
if (!norma.includes("CHECKLIST_EMBARCACION")) fail("normativa sin CHECKLIST_EMBARCACION");
if (norma.includes("Esta app no cubre pesca desde embarcación")) {
  fail("normativa aún dice que no cubre embarcación");
}
ok("normativa embarcación");

const mod = read("src/data/modalidades.ts");
if (!mod.includes("esModalidadEmbarcacionMar")) fail("modalidades sin helper embarcación");
ok("modalidades");

const col = JSON.parse(read("src/data/vedadosMarinos.json"));
if (!col.some((z) => z.id === "columbretes")) fail("falta polígono Columbretes");
ok("Columbretes");

const esp = JSON.parse(read("src/data/especiesEmbarcacion.json"));
if ((esp.usualesIds || []).length < 10) fail("catálogo embarcación demasiado corto");
if (!esp.pescables?.some((s) => s.id === "denton")) fail("falta dentón en embarcación");
if (!esp.pescables?.some((s) => s.id === "bonito")) fail("falta bonito en embarcación");
ok("especies embarcación");

const apa = JSON.parse(read("src/data/aparejosEmbarcacion.json"));
if (!apa.porId?.lubina || !apa.porId?.denton) fail("aparejos embarcación incompletos");
ok("aparejos embarcación");

const cat = read("src/services/catalogoEspeciesService.ts");
if (!cat.includes("especiesEmbarcacionUsuales")) fail("catálogo sin especiesEmbarcacionUsuales");
ok("catalogoEspeciesService");

const mapa = read("src/screens/ZonasLibresScreen.tsx");
if (!mapa.includes("consultarEmbarcacion")) fail("mapa sin consultarEmbarcacion");
if (!mapa.includes("CapaVedadosMarinos")) fail("mapa sin CapaVedadosMarinos");
if (!mapa.includes("etaAPuerto")) fail("mapa sin ETA puerto");
if (!mapa.includes("guardarWaypointMarino")) fail("mapa sin waypoints");
ok("mapa embarcación");

const app = read("App.tsx");
if (!app.includes("SalgoEnBarco")) fail("App sin pantalla SalgoEnBarco");
ok("App SalgoEnBarco");

const home = read("src/screens/HomeScreen.tsx");
if (!home.includes("SalgoEnBarco")) fail("Home sin CTA Salgo en barco");
ok("Home CTA");

const aparejos = read("src/screens/AparejosScreen.tsx");
if (!aparejos.includes("aparejosEmbarcacion") || !aparejos.includes('"barco"')) {
  fail("Aparejos sin pestaña barco");
}
ok("Aparejos barco");

const boat = read("src/services/boatIndexService.ts");
if (!boat.includes("calcularIndiceBarco") || !boat.includes("wave_height")) {
  fail("índice barco incompleto");
}
ok("boatIndexService");

const nav = read("src/services/navegacionEmbarcacionService.ts");
if (!nav.includes("estimarProfundidadMarCastellon") || !nav.includes("etaAPuerto")) {
  fail("navegación embarcación incompleta");
}
ok("navegacionEmbarcacionService");

const ritual = read("src/screens/SalgoEnBarcoScreen.tsx");
if (!ritual.includes("CHECKLIST_EMBARCACION") || !ritual.includes("calcularIndiceBarco")) {
  fail("ritual SalgoEnBarco incompleto");
}
ok("ritual SalgoEnBarco");

if (fallos) {
  console.error(`\n${fallos} fallos`);
  process.exit(1);
}
console.log("\nassert_embarcacion_castellon: OK");
