/**
 * Smoke: regresiones del repaso (Home espera puntoListo, Mapa GPS sin doble fijar,
 * runtime clear, población con provinciaId).
 *
 * Uso: node scripts/assert_repaso_errores.mjs
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

const home = readFileSync(join(root, "src/screens/HomeScreen.tsx"), "utf8");
const mapa = readFileSync(join(root, "src/screens/ZonasLibresScreen.tsx"), "utf8");
const prev = readFileSync(join(root, "src/screens/PrevisionScreen.tsx"), "utf8");
const runtime = readFileSync(join(root, "src/provincias/runtime.ts"), "utf8");
const ctx = readFileSync(join(root, "src/context/ProvinciaContext.tsx"), "utf8");
const poblacion = readFileSync(join(root, "src/services/poblacionCercanaService.ts"), "utf8");

if (!/if\s*\(\s*!puntoListo\s*\)\s*return/.test(home)) {
  fail("HomeScreen debe esperar puntoListo antes de bootstrap");
} else {
  ok("HomeScreen espera puntoListo");
}

if (!home.includes("sigueVivo") && !home.includes("okVivo")) {
  fail("HomeScreen.cargar debe respetar cancelación");
} else {
  ok("HomeScreen cancela cargas stale");
}

// irAMiPosicion no debe llamar evaluarPunto (doble fijar mapa+gps)
const irBlock = mapa.slice(mapa.indexOf("async function irAMiPosicion"), mapa.indexOf("return (", mapa.indexOf("async function irAMiPosicion")));
if (irBlock.includes("evaluarPunto(")) {
  fail("irAMiPosicion no debe llamar evaluarPunto (pisa fuente gps con mapa)");
} else {
  ok("Mapa GPS fija punto una sola vez");
}
if (!irBlock.includes('fuente: "gps"')) {
  fail("irAMiPosicion debe fijar fuente gps");
} else {
  ok("Mapa GPS usa fuente gps");
}

if (!prev.includes("cargaIdRef") && !prev.includes("idCarga")) {
  fail("Previsión debe ignorar respuestas stale");
} else {
  ok("Previsión usa generation id");
}

if (!runtime.includes("clearProvinciaActiva")) {
  fail("runtime debe exportar clearProvinciaActiva");
} else {
  ok("runtime.clearProvinciaActiva existe");
}

if (!ctx.includes("clearProvinciaActiva")) {
  fail("cambiarProvincia debe limpiar el runtime");
} else {
  ok("cambiarProvincia limpia runtime");
}

if (!/provinciaId\?: ProvinciaId/.test(poblacion) && !poblacion.includes("provinciaId?:")) {
  fail("resolverPoblacionCercana debe aceptar provinciaId");
} else {
  ok("población acepta provinciaId");
}

if (fallos) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nTodo OK · regresiones del repaso cubiertas.");
