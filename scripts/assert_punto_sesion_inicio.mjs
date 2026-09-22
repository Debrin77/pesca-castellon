/**
 * Assert: Inicio no muestra «¿Puedo?» ni «Tu punto de hoy» solo porque
 * haya un punto restaurado de la sesión anterior. Hace falta gesto en esta
 * sesión (mapa / GPS / zona / recomendación) o «Usar último».
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

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const ctx = read("src/context/PuntoConsultaContext.tsx");
for (const n of [
  "puntoElegido",
  "confirmarPuntoGuardado",
  "setPuntoElegido(false)",
  "setPuntoElegido(true)",
]) {
  if (!ctx.includes(n)) fail(`PuntoConsultaContext sin ${n}`);
}
// Al restaurar desde AsyncStorage no debe marcar elegido.
if (!/leerPuntoConsulta[\s\S]{0,400}setPuntoElegido\(false\)/.test(ctx)) {
  fail("punto restaurado no debe activar puntoElegido");
}
if (!/fijarPunto[\s\S]{0,500}setPuntoElegido\(true\)/.test(ctx)) {
  fail("fijarPunto debe marcar puntoElegido");
}

const home = read("src/screens/HomeScreen.tsx");
for (const n of [
  "puntoElegido",
  "puntoAnterior",
  "confirmarPuntoGuardado",
  "Último ·",
  "Usar ›",
  "fijarPunto",
]) {
  if (!home.includes(n)) fail(`HomeScreen sin ${n}`);
}
if (!home.includes("puntoElegido &&")) {
  fail("puntoExplicito / consultaViva debe exigir puntoElegido de esta sesión");
}
// Tocar recomendación fija el punto (desbloquea veredicto al volver).
if (!/onAbrir=\{\(r\) => \{[\s\S]{0,800}fijarPunto\(/.test(home)) {
  fail("Hoy te conviene debe fijarPunto al tocar una recomendación");
}
if (!home.includes("zonaConocida")) {
  fail("Recomendación: no abrir ZoneDetail con ids de tramo GeoJSON");
}

const pkg = read("package.json");
if (!pkg.includes("assert_punto_sesion_inicio.mjs")) {
  fail("package.json assert debe incluir assert_punto_sesion_inicio.mjs");
}

if (fallos) {
  console.error(`assert_punto_sesion_inicio: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_punto_sesion_inicio");
