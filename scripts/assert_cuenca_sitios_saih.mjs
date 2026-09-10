/**
 * Smoke: sitios comunidad Cuenca no cruzan con otras provincias + marco CLM.
 * Uso: node scripts/assert_cuenca_sitios_saih.mjs
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

let fallos = 0;
function fail(m) {
  console.error("FAIL:", m);
  fallos++;
}
function ok(m) {
  console.log("OK:", m);
}

const sitiosCu = JSON.parse(readFileSync(join(root, "src/provincias/cuenca/sitiosComunidad.json"), "utf8"));
const sitiosCs = JSON.parse(readFileSync(join(root, "src/data/sitiosComunidad.json"), "utf8"));
const sitiosSev = JSON.parse(readFileSync(join(root, "src/provincias/sevilla/sitiosComunidad.json"), "utf8"));
const sitiosCo = JSON.parse(readFileSync(join(root, "src/provincias/cordoba/sitiosComunidad.json"), "utf8"));
const zones = JSON.parse(readFileSync(join(root, "src/provincias/cuenca/zones.json"), "utf8"));
const tramos = JSON.parse(readFileSync(join(root, "src/provincias/cuenca/tramosOficiales.json"), "utf8"));
const config = readFileSync(join(root, "src/provincias/cuenca/config.ts"), "utf8");
const normativa = readFileSync(join(root, "src/provincias/cuenca/normativa.ts"), "utf8");
const index = readFileSync(join(root, "src/provincias/index.ts"), "utf8");
const tipos = readFileSync(join(root, "src/provincias/types.ts"), "utf8");
const sitiosSvc = readFileSync(join(root, "src/services/sitiosComunidad.ts"), "utf8");
const geo = readFileSync(join(root, "src/services/geojsonHit.ts"), "utf8");
const selector = readFileSync(join(root, "src/screens/SelectorProvinciaScreen.tsx"), "utf8");

if (!tipos.includes('"cuenca"') && !tipos.includes("'cuenca'")) fail("types.ts sin ProvinciaId cuenca");
else ok("ProvinciaId incluye cuenca");

if (!tipos.includes("esProvinciaCastillaLaMancha")) fail("types.ts sin esProvinciaCastillaLaMancha");
else ok("helper Castilla-La Mancha");

if (!index.includes("cuencaConfig") || !index.includes("esProvinciaCastillaLaMancha")) {
  fail("index.ts debe registrar cuenca y esProvinciaCastillaLaMancha");
} else ok("registry Cuenca");

if (!selector.includes("cuenca:")) fail("SelectorProvincia sin COPY.cuenca");
else ok("selector COPY Cuenca");

if (!selector.includes("Castilla-La Mancha")) fail("selector Cuenca debe indicar Castilla-La Mancha");
else ok("kicker Castilla-La Mancha");

if (!normativa.includes("Orden 20/2026") || !normativa.includes("Ley 1/1992")) {
  fail("normativa Cuenca debe citar Orden 20/2026 y Ley 1/1992");
} else ok("normativa CLM");

if (/seguro obligatorio de responsabilidad civil del pescador/i.test(normativa) && !/no se exige seguro/i.test(normativa)) {
  fail("normativa Cuenca no debe exigir seguro RC andaluz");
} else ok("normativa sin exigir seguro RC");

if (/\bDERA\b|art\. 5\.2 Orden 13\/01\/2023|NIR del Registro Andaluz/i.test(normativa)) {
  fail("normativa Cuenca no debe usar marco cartográfico/legal andaluz (DERA / art. 5.2 / NIR)");
} else ok("normativa sin DERA/NIR andaluz");

const idsTramo = new Set(tramos.map((t) => t.id));
const idsZona = new Set(zones.map((z) => z.id));

for (const id of Object.keys(sitiosCu.porTramo)) {
  if (!id.startsWith("cue-")) fail(`sitio Cuenca sin prefijo cue-: ${id}`);
  if (!idsTramo.has(id)) fail(`sitio apunta a tramo inexistente: ${id}`);
  if (sitiosCs.porTramo[id]) fail(`cruce: id Cuenca también en Castellón: ${id}`);
  if (sitiosSev.porTramo[id]) fail(`cruce: id Cuenca también en Sevilla: ${id}`);
  if (sitiosCo.porTramo[id]) fail(`cruce: id Cuenca también en Córdoba: ${id}`);
}
ok(`sitios Cuenca: ${Object.keys(sitiosCu.porTramo).length} tramos, sin cruce`);

for (const t of tramos) {
  if (t.aprovechamiento === "VP" && sitiosCu.porTramo[t.id]) {
    fail(`refugio/VP no debe tener sitios: ${t.id}`);
  }
  if (!t.id.startsWith("cue-")) fail(`tramo sin prefijo cue-: ${t.id}`);
}
ok("refugios VP sin sitios orientativos + prefijo cue-");

const saihZones = zones.filter((z) => z.saihNombre);
for (const z of saihZones) {
  if (z.saihFuente !== "chj") fail(`${z.id} debe tener saihFuente=chj`);
  if (!z.saihUrl || !z.saihUrl.includes("saih.chj.es")) fail(`${z.id} saihUrl CHJ inválida`);
}
ok(`${saihZones.length} zonas con SAIH CHJ verificado`);

for (const z of zones.filter((x) => x.estadoZona === "vedada")) {
  if (z.saihNombre) fail(`refugio ${z.id} no debe tener saihNombre`);
}
ok("refugios sin SAIH de pesca");

if (!config.includes("tieneSaih: true")) fail("cuenca config debe activar tieneSaih");
if (!config.includes('red: "chj"')) fail("embalsesPanel Cuenca debe usar red chj");
if (!config.includes("continentalOnly: true")) fail("Cuenca debe ser continentalOnly");
if (/from\s+[\"'].*species\.json[\"']/.test(config)) fail("cuenca/config no debe importar species.json Castellón");
if (!config.includes("Castilla-La Mancha") && !config.includes("JCCM")) {
  fail("config Cuenca debe citar licencia CLM/JCCM");
} else ok("config continental + species propias + licencia CLM");

if (!config.includes("seguroObligatorio: false")) fail("Cuenca no debe exigir seguro RC");
else ok("sin seguro RC (CLM)");

if (!sitiosSvc.includes("cuenca/sitiosComunidad") || !sitiosSvc.includes("cue-")) {
  fail("sitiosComunidad debe cargar JSON de Cuenca y prefijo cue-");
} else ok("sitios aislados por provincia (Cuenca)");

if (!geo.includes("cuenca/pescaOficial") || !geo.includes("cuenca")) {
  fail("geojsonHit debe cargar pescaOficial de Cuenca");
} else ok("geojsonHit Cuenca");

const pesca = JSON.parse(readFileSync(join(root, "src/provincias/cuenca/pescaOficial.json"), "utf8"));
if (!pesca.features?.length) fail("pescaOficial Cuenca vacío");
else ok(`${pesca.features.length} polígonos OSM/catálogo Cuenca`);

const facil = readFileSync(join(root, "src/data/sitiosFaciles.ts"), "utf8");
if (!facil.includes("cuenca:")) fail("sitiosFaciles sin entrada Cuenca");
else ok("sitios fáciles Cuenca");

const overrides = JSON.parse(
  readFileSync(join(root, "src/provincias/cuenca/speciesOverrides.json"), "utf8")
);
const blob = JSON.stringify(overrides);
if (/Orden 30\/2016|Comunitat Valenciana|\bGVA\b|BOJA|Junta de Andalucía/i.test(blob)) {
  fail("speciesOverrides Cuenca arrastra textos CV o Andalucía");
} else ok("especies sin textos CV/Andalucía");
if (!/Orden 20\/2026|CLM|Castilla-La Mancha/i.test(blob)) {
  fail("speciesOverrides debe citar marco CLM");
} else ok("especies con marco CLM");

if (fallos) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nTodo OK.");
