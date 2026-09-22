/**
 * Assert: correcciones a rozaduras UX —
 * 1) Continuar sesión (modo + punto) en un toque
 * 2) Aparejos/Licencia descubribles fuera del hero con punto
 * 3) Catálogo Especies: búsqueda + autoabrir sitios hoy
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
for (const n of [
  "continuarSesion",
  "reanudarSesion",
  "Continuar ·",
  "herramientasKicker",
  "Herramientas",
]) {
  if (!home.includes(n)) fail(`HomeScreen sin ${n}`);
}
if (!home.includes('navigate("Aparejos"') || !home.includes("herramientasKicker")) {
  fail("Home herramientas debe enlazar Aparejos");
}
if (!/herramientasKicker[\s\S]{0,800}navigate\("License"\)/.test(home)) {
  fail("Home herramientas debe enlazar Licencia");
}

const app = read("App.tsx");
if (!app.includes('name="License"') || !/ConsejosStack[\s\S]*License/.test(app)) {
  fail("ConsejosStack debe incluir License");
}

const consejos = read("src/screens/ConsejosScreen.tsx");
for (const n of ["atajosRow", 'navigate?.("Aparejos")', 'navigate?.("License")', "Licencia ›"]) {
  if (!consejos.includes(n)) fail(`ConsejosScreen sin ${n}`);
}

const especies = read("src/screens/EspeciesScreen.tsx");
for (const n of [
  "busquedaCatalogo",
  "Busca especie (barbo",
  "autoSitiosRio",
  "autoAbrir",
  "headerRight",
  'navigate("License")',
]) {
  if (!especies.includes(n)) fail(`EspeciesScreen sin ${n}`);
}

const top = read("src/components/TopSitiosEspecie.tsx");
if (!top.includes("autoAbrir") || !top.includes("¿Dónde hoy?")) {
  fail("TopSitiosEspecie debe autoAbrir y CTA ¿Dónde hoy?");
}

const tarjeta = read("src/components/TarjetaEspecie.tsx");
const iNombre = tarjeta.indexOf("{sp.nombreCientifico}");
const iExtra = tarjeta.indexOf("{extra}");
const iNotas = tarjeta.indexOf("{sp.notas");
if (!(iNombre > 0 && iExtra > iNombre && iExtra < iNotas)) {
  fail("TarjetaEspecie: sitios (extra) deben ir justo tras el nombre científico");
}

const pkg = read("package.json");
if (!pkg.includes("assert_rozaduras_ux.mjs")) {
  fail("package.json assert debe incluir assert_rozaduras_ux.mjs");
}

if (fallos) {
  console.error(`assert_rozaduras_ux: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_rozaduras_ux");
