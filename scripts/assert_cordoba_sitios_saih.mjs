/**
 * Smoke: sitios comunidad Córdoba no cruzan con Castellón/Sevilla + SAIH CHG EmbalCO.
 * Uso: node scripts/assert_cordoba_sitios_saih.mjs
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

const sitiosCo = JSON.parse(readFileSync(join(root, "src/provincias/cordoba/sitiosComunidad.json"), "utf8"));
const sitiosCs = JSON.parse(readFileSync(join(root, "src/data/sitiosComunidad.json"), "utf8"));
const sitiosSev = JSON.parse(readFileSync(join(root, "src/provincias/sevilla/sitiosComunidad.json"), "utf8"));
const zones = JSON.parse(readFileSync(join(root, "src/provincias/cordoba/zones.json"), "utf8"));
const tramos = JSON.parse(readFileSync(join(root, "src/provincias/cordoba/tramosOficiales.json"), "utf8"));
const config = readFileSync(join(root, "src/provincias/cordoba/config.ts"), "utf8");
const index = readFileSync(join(root, "src/provincias/index.ts"), "utf8");
const tipos = readFileSync(join(root, "src/provincias/types.ts"), "utf8");
const sitiosSvc = readFileSync(join(root, "src/services/sitiosComunidad.ts"), "utf8");
const geo = readFileSync(join(root, "src/services/geojsonHit.ts"), "utf8");
const selector = readFileSync(join(root, "src/screens/SelectorProvinciaScreen.tsx"), "utf8");

if (!tipos.includes('"cordoba"') && !tipos.includes("'cordoba'")) fail("types.ts sin ProvinciaId cordoba");
else ok("ProvinciaId incluye cordoba");

if (!index.includes("cordobaConfig") || !index.includes("esProvinciaAndalucia")) {
  fail("index.ts debe registrar cordoba y esProvinciaAndalucia");
} else ok("registry Córdoba");

if (!selector.includes("cordoba:")) fail("SelectorProvincia sin COPY.cordoba");
else ok("selector COPY Córdoba");

const idsTramo = new Set(tramos.map((t) => t.id));
const idsZona = new Set(zones.map((z) => z.id));

for (const id of Object.keys(sitiosCo.porTramo)) {
  if (!id.startsWith("cor-")) fail(`sitio Córdoba sin prefijo cor-: ${id}`);
  if (!idsTramo.has(id)) fail(`sitio apunta a tramo inexistente: ${id}`);
  if (sitiosCs.porTramo[id]) fail(`cruce: id Córdoba también en Castellón: ${id}`);
  if (sitiosSev.porTramo[id]) fail(`cruce: id Córdoba también en Sevilla: ${id}`);
}
ok(`sitios Córdoba: ${Object.keys(sitiosCo.porTramo).length} tramos, sin cruce`);

for (const t of tramos) {
  if (t.aprovechamiento === "VP" && sitiosCo.porTramo[t.id]) {
    fail(`refugio/VP no debe tener sitios: ${t.id}`);
  }
}
ok("refugios VP sin sitios orientativos");

const saihZones = zones.filter((z) => z.saihNombre);
for (const z of saihZones) {
  if (z.saihFuente !== "chg") fail(`${z.id} debe tener saihFuente=chg`);
  if (!z.saihUrl || !z.saihUrl.includes("chguadalquivir.es/saih")) fail(`${z.id} saihUrl CHG inválida`);
  if (!/^E\d{2}\s/.test(z.saihNombre)) fail(`${z.id} saihNombre debe ser código E## CHG`);
}
ok(`${saihZones.length} zonas con SAIH CHG verificado`);

// Refugios no deben llevar SAIH de pesca (vedado)
for (const z of zones.filter((x) => x.estadoZona === "vedada")) {
  if (z.saihNombre) fail(`refugio ${z.id} no debe tener saihNombre`);
}
ok("refugios sin SAIH de pesca");

if (!config.includes("tieneSaih: true")) fail("cordoba config debe activar tieneSaih");
if (!config.includes('red: "chg"')) fail("embalsesPanel Córdoba debe usar red chg");
if (!config.includes("EmbalCO")) fail("embalsesPanel Córdoba debe usar EmbalCO");
else ok("config Córdoba SAIH CHG EmbalCO activo");

if (!config.includes("continentalOnly: true")) fail("Córdoba debe ser continentalOnly");
if (/from\s+[\"'].*species\.json[\"']/.test(config)) fail("cordoba/config no debe importar species.json Castellón");
else ok("config continental + species propias");

if (!sitiosSvc.includes("cordoba/sitiosComunidad") || !sitiosSvc.includes("cor-")) {
  fail("sitiosComunidad debe cargar JSON de Córdoba y prefijo cor-");
} else ok("sitios aislados por provincia (Córdoba)");

if (!geo.includes("cordoba/pescaOficial") || !geo.includes("cordoba")) {
  fail("geojsonHit debe cargar pescaOficial de Córdoba");
} else ok("geojsonHit Córdoba");

const pesca = JSON.parse(readFileSync(join(root, "src/provincias/cordoba/pescaOficial.json"), "utf8"));
if (!pesca.features?.length) fail("pescaOficial Córdoba vacío");
else ok(`${pesca.features.length} polígonos DERA Córdoba`);

const facil = readFileSync(join(root, "src/data/sitiosFaciles.ts"), "utf8");
if (!facil.includes("cordoba:")) fail("sitiosFaciles sin entrada Córdoba");
else ok("sitios fáciles Córdoba");

if (fallos) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nTodo OK.");
