/**
 * Assert: modo global Río/Orilla/Barco + hero sin SIN TRAMO prematuro +
 * mapa solo consulta + Salgo unificado + tarjeta punto.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let fallos = 0;
function fail(msg) {
  console.error("FAIL", msg);
  fallos++;
}
function ok(msg) {
  console.log("OK", msg);
}
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

for (const f of [
  "src/data/modoPesca.ts",
  "src/context/ModoPescaContext.tsx",
  "src/components/SelectorModoPesca.tsx",
  "src/components/TarjetaPuntoHoy.tsx",
]) {
  if (!fs.existsSync(path.join(root, f))) fail(`falta ${f}`);
  else ok(f);
}

const modo = read("src/data/modoPesca.ts");
for (const n of ['"rio"', '"orilla"', '"barco"', "modosDisponibles", "modoAMapaModo"]) {
  if (!modo.includes(n)) fail(`modoPesca sin ${n}`);
}

const app = read("App.tsx");
if (!app.includes("ModoPescaProvider")) fail("App sin ModoPescaProvider");

const home = read("src/screens/HomeScreen.tsx");
for (const n of [
  "SelectorModoPesca",
  "TarjetaPuntoHoy",
  "puntoExplicito",
  "Pulsa el mapa o usa GPS",
  "useModoPesca",
]) {
  if (!home.includes(n)) fail(`HomeScreen sin ${n}`);
}
// Un solo CTA principal (no gemelo Salgo en barco fijo en hero)
if (home.includes("Embarcación / kayak</Text>") && home.includes("Salgo a pescar</Text>") && home.includes("Salgo en barco</Text>") && !home.includes("modo === \"barco\"")) {
  fail("Home aún muestra dos CTAs gemelos sin unificar por modo");
}
if (!home.includes('modo === "barco"')) fail("Home debe ramificar CTA según modo barco");

const mapa = read("src/screens/ZonasLibresScreen.tsx");
for (const n of ["mapaSimple", "Solo consulta", "Capas avanzadas", "SelectorModoPesca", "modoGlobal"]) {
  if (!mapa.includes(n)) fail(`ZonasLibresScreen sin ${n}`);
}

const salgo = read("src/screens/SalgoAPescarScreen.tsx");
for (const n of ["SelectorModoPesca", "SalgoEnBarco", "useModoPesca", "barcoLink"]) {
  if (!salgo.includes(n)) fail(`SalgoAPescarScreen sin ${n}`);
}

const tarjeta = read("src/components/TarjetaPuntoHoy.tsx");
for (const n of ["onPuedo", "onPinta", "onEquipo", "onEspecies", "Tu punto de hoy"]) {
  if (!tarjeta.includes(n)) fail(`TarjetaPuntoHoy sin ${n}`);
}

const pkg = read("package.json");
if (!pkg.includes("assert_modo_global_5ux.mjs")) {
  fail("package.json assert debe incluir assert_modo_global_5ux.mjs");
}

if (fallos) {
  console.error(`assert_modo_global_5ux: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_modo_global_5ux");
