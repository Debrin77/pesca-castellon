/**
 * Assert: Inicio con apartados plegables (sin numeración escolar; sin omitir contenido).
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

const home = read("src/screens/HomeScreen.tsx");
const apartado = read("src/components/ApartadoPlegable.tsx");
const explorar = read("src/components/PanelExplorarSitios.tsx");

for (const n of [
  "ApartadoPlegable",
  "ApartadoFijo",
  'titulo="Cómo pescas"',
  'titulo="Tu salida"',
  'titulo="Pulso del día"',
  'titulo="Más de hoy"',
  'titulo="Herramientas"',
  "<TarjetaPuntoHoy",
  "<PanelExplorarSitios",
  "<BloqueAprende",
  "pulsoRow",
  "ConsultaPescaCard",
]) {
  if (!home.includes(n)) fail(`HomeScreen sin ${n}`);
}

// Sin numeración visible tipo 1·2·3 / A·B·C en Inicio
if (/orden=\{[0-9]+\}/.test(home)) {
  fail("HomeScreen no debe numerar apartados (orden={n})");
}
if (/orden="[A-E]"/.test(explorar) || /orden=\{orden\}/.test(explorar)) {
  fail("PanelExplorarSitios no debe numerar bloques (A–E / orden prop)");
}

for (const n of ["subCerrado", "accessibilityState={{ expanded: abierto }}", "interno", "chevronWrap"]) {
  if (!apartado.includes(n)) fail(`ApartadoPlegable sin ${n}`);
}

for (const n of [
  'titulo="Ideas y sitios"',
  'titulo="Niveles SAIH"',
  'titulo="Quiero pescar"',
  'titulo="Hoy te conviene"',
  'titulo="Para salir hoy"',
  "inicialAbierto",
]) {
  if (!explorar.includes(n)) fail(`PanelExplorarSitios sin ${n}`);
}

// Orden: modalidad → salida → pulso → ideas → más de hoy
const i1 = home.indexOf('titulo="Cómo pescas"');
const i2 = home.indexOf('titulo="Tu salida"');
const i3 = home.indexOf('titulo="Pulso del día"');
const i4 = home.indexOf("<PanelExplorarSitios");
const i6 = home.indexOf('titulo="Más de hoy"');
if (!(i1 < i2 && i2 < i3 && i3 < i4 && i4 < i6)) {
  fail("Orden apartados: Cómo pescas → Tu salida → Pulso → Ideas → Más de hoy");
}

const pkg = read("package.json");
if (!pkg.includes("assert_inicio_apartados_desplegables.mjs")) {
  fail("package.json assert debe incluir assert_inicio_apartados_desplegables.mjs");
}

if (fallos) {
  console.error(`assert_inicio_apartados_desplegables: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_inicio_apartados_desplegables");
