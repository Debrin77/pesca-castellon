/**
 * Assert: modo global Río/Orilla/Barco + hero sin SIN TRAMO prematuro +
 * mapa solo consulta + Salgo unificado + tarjeta punto + flujo sin fallback prematuro.
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
for (const n of ['"rio"', '"orilla"', '"barco"', "modosDisponibles", "modoAMapaModo", "textoPedirModo"]) {
  if (!modo.includes(n)) fail(`modoPesca sin ${n}`);
}

const app = read("App.tsx");
if (!app.includes("ModoPescaProvider")) fail("App sin ModoPescaProvider");

const ctx = read("src/context/ModoPescaContext.tsx");
for (const n of ["modoElegido", "modoRecordado", "claveModo", "setModo", "setModoElegido(unica)"]) {
  if (!ctx.includes(n)) fail(`ModoPescaContext sin ${n}`);
}
// Al arrancar con varias modalidades no basta el valor guardado: hay que pulsar.
if (/opts\.includes\(raw\)[\s\S]{0,200}setModoElegido\(true\)/.test(ctx)) {
  fail("modoElegido no debe activarse solo por AsyncStorage en multi-modalidad");
}

const selector = read("src/components/SelectorModoPesca.tsx");
if (!selector.includes("ModoPescaGlobal | null")) {
  fail("SelectorModoPesca debe aceptar modo null hasta elegir");
}
if (!selector.includes("textoPedirModo")) {
  fail("Selector debe pedir elección según modalidades disponibles");
}
if (!selector.includes("¿Seguir en") || !selector.includes("modoRecordado")) {
  fail("Selector debe ofrecer chip ¿Seguir en…? con la última modalidad");
}

const home = read("src/screens/HomeScreen.tsx");
for (const n of [
  "SelectorModoPesca",
  "TarjetaPuntoHoy",
  "puntoExplicito",
  "Pulsa el mapa, GPS o una recomendación",
  "useModoPesca",
  "modoElegido",
  "modoRecordado",
  "modoListo",
  "textoPedirModo",
  "pulsoCard",
]) {
  if (!home.includes(n)) fail(`HomeScreen sin ${n}`);
}
if (!home.includes("modoElegido && consultaViva")) {
  fail("Home debe mostrar «Tu punto de hoy» solo tras elegir modalidad");
}
// Pulso visible sin modalidad (clima); el gate legal sigue en consultaViva / tarjeta.
if (home.includes("{modoElegido ? (\n          <View style={styles.pulsoCard}")) {
  fail("Pulso del día debe verse también sin modalidad elegida");
}
if (!home.includes("modoElegido ? modo : null")) {
  fail("Home selector debe pasar null si aún no hay modalidad");
}
if (!home.includes("modoRecordado={!modoElegido && !continuarSesion ? modoRecordado : null}")) {
  fail("Home debe pasar modoRecordado al selector (salvo Continuar unificado)");
}
if (!home.includes("continuarSesion") || !home.includes("reanudarSesion") || !home.includes("Continuar ·")) {
  fail("Home debe ofrecer Continuar (modo + último punto) en un toque");
}
// No consultar con fallback río antes de elegir modalidad
if (!home.includes("modoListo && modoElegido && puntoExplicito")) {
  fail("consultaViva debe exigir modalidad elegida (no fallback río)");
}
if (!home.includes("puntoElegido")) {
  fail("Home debe exigir puntoElegido de esta sesión (no restaurar veredicto)");
}
if (!home.includes("modoListo && !modoElegido")) {
  fail("Hero debe pedir modalidad antes del veredicto vacío de punto");
}
// Un solo CTA principal (no gemelo Salgo en barco fijo en hero)
if (home.includes("Embarcación / kayak</Text>") && home.includes("Salgo a pescar</Text>") && home.includes("Salgo en barco</Text>") && !home.includes("modo === \"barco\"")) {
  fail("Home aún muestra dos CTAs gemelos sin unificar por modo");
}
if (!home.includes('modo === "barco"')) fail("Home debe ramificar CTA según modo barco");

const mapa = read("src/screens/ZonasLibresScreen.tsx");
for (const n of ["mapaSimple", "Solo consulta", "Capas avanzadas", "SelectorModoPesca", "modoGlobal", "modoElegido", "modoRecordado"]) {
  if (!mapa.includes(n)) fail(`ZonasLibresScreen sin ${n}`);
}
if (!mapa.includes("if (!modoElegido) return")) {
  fail("Mapa no debe sincronizar ámbito global hasta elegir modalidad");
}

const especies = read("src/screens/EspeciesScreen.tsx");
if (!especies.includes("if (!modoElegido) return")) {
  fail("Especies no debe sincronizar ámbito global hasta elegir modalidad");
}

const salgo = read("src/screens/SalgoAPescarScreen.tsx");
for (const n of ["SelectorModoPesca", "SalgoEnBarco", "useModoPesca", "barcoLink", "modoElegido"]) {
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
