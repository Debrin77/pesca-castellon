/**
 * Smoke: sitios comunidad Sevilla no cruzan con Castellón + SAIH CHG cableado.
 * Uso: node scripts/assert_sevilla_sitios_saih.mjs
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

const sitiosSev = JSON.parse(readFileSync(join(root, "src/provincias/sevilla/sitiosComunidad.json"), "utf8"));
const sitiosCs = JSON.parse(readFileSync(join(root, "src/data/sitiosComunidad.json"), "utf8"));
const zones = JSON.parse(readFileSync(join(root, "src/provincias/sevilla/zones.json"), "utf8"));
const tramos = JSON.parse(readFileSync(join(root, "src/provincias/sevilla/tramosOficiales.json"), "utf8"));
const config = readFileSync(join(root, "src/provincias/sevilla/config.ts"), "utf8");
const saih = readFileSync(join(root, "src/services/saihService.ts"), "utf8");
const sitiosSvc = readFileSync(join(root, "src/services/sitiosComunidad.ts"), "utf8");

const idsTramo = new Set(tramos.map((t) => t.id));
const idsZona = new Set(zones.map((z) => z.id));

for (const id of Object.keys(sitiosSev.porTramo)) {
  if (!id.startsWith("sev-")) fail(`sitio Sevilla sin prefijo sev-: ${id}`);
  if (!idsTramo.has(id)) fail(`sitio apunta a tramo inexistente: ${id}`);
  // no cruce con Castellón
  if (sitiosCs.porTramo[id]) fail(`cruce: id Sevilla también en Castellón: ${id}`);
}
ok(`sitios Sevilla: ${Object.keys(sitiosSev.porTramo).length} tramos, sin cruce`);

// Refugios no deben tener sitios
for (const t of tramos) {
  if (t.aprovechamiento === "VP" && sitiosSev.porTramo[t.id]) {
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

// Sin inventar SAIH para masas sin panel
for (const id of ["embalse_de_jarrama", "embalse_molinos_castilblanco", "embalse_de_alcala_del_rio"]) {
  const z = zones.find((x) => x.id === id);
  if (z?.saihNombre) fail(`${id} no debe tener saihNombre (no está en EmbalSE/EmbalCO)`);
}
ok("Jarrama/Molinos/Alcalá sin SAIH inventado");

if (!config.includes("tieneSaih: true")) fail("sevilla config debe activar tieneSaih");
if (!config.includes('red: "chg"')) fail("embalsesPanel Sevilla debe usar red chg");
else ok("config Sevilla SAIH CHG activo");

if (!saih.includes("parsearEmbalseChg") || !saih.includes("saih_chg")) fail("saihService debe parsear CHG");
else ok("saihService soporta CHG");

if (!sitiosSvc.includes("sitiosComunidad.json") || !sitiosSvc.includes('sevilla/sitiosComunidad')) {
  fail("sitiosComunidad debe cargar JSON de Sevilla aparte");
} else ok("sitios aislados por provincia");

// Anti-cruce textual básico: un sitio de Pintado no debe mencionar "Torre del Águila" como ubicación propia confusa
const pintado = sitiosSev.porTramo["sev-embalse_del_pintado"] || [];
for (const s of pintado) {
  if (/torre del águila|josé torán|minilla/i.test(s.nombre)) {
    fail(`posible cruce en nombre de sitio Pintado: ${s.nombre}`);
  }
}
ok("Pintado sin nombres de otros embalses");

if (fallos) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nTodo OK.");
