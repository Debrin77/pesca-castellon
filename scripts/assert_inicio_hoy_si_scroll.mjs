/**
 * Assert: chip HOY SÍ / veredictoRapido hace scroll fiable a «Más de hoy».
 * - Ancla con onLayout + measureInWindow
 * - Orden: Salgo → contenido → Más de hoy
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

const home = fs.readFileSync(path.join(root, "src/screens/HomeScreen.tsx"), "utf8");

for (const needle of [
  "tramoAnchorRef",
  "scrollYRef",
  "scrollADetalleTramo",
  "measureInWindow",
  "abrirVeredictoRapido",
  "Más de hoy",
  "collapsable={false}",
  "mostrarAprende",
  "indexHint",
]) {
  if (!home.includes(needle)) fail(`HomeScreen sin ${needle}`);
}

const iTitulo = home.indexOf('titulo="Más de hoy"');
const ventana = home.slice(Math.max(0, iTitulo - 800), iTitulo + 200);
if (iTitulo < 0 || !ventana.includes("ref={tramoAnchorRef}")) {
  fail("El ancla del detalle debe envolver el bloque (ref={tramoAnchorRef})");
}
if (iTitulo < 0 || !ventana.includes("ApartadoPlegable")) {
  fail("Más de hoy debe ser apartado desplegable (ApartadoPlegable)");
}

const iSalgo =
  home.indexOf("ctaSalgoTitle") >= 0
    ? home.indexOf("ctaSalgoTitle")
    : home.indexOf("<SiguientePasoCard") >= 0
      ? home.indexOf("<SiguientePasoCard")
      : home.indexOf("Abrir Salgo a pescar");
if (!(iSalgo >= 0 && iTitulo > iSalgo)) {
  fail("Más de hoy debe ir después del CTA Salgo a pescar");
}

// Contenido completo en Inicio (organizado, no omitido)
if (!home.includes("<BloqueAprende") || !home.includes("<PanelExplorarSitios")) {
  fail("Inicio debe montar BloqueAprende y PanelExplorarSitios (sin omitir)");
}

const pkg = fs.readFileSync(path.join(root, "package.json"), "utf8");
if (!pkg.includes("assert_inicio_hoy_si_scroll.mjs")) {
  fail("package.json assert debe incluir assert_inicio_hoy_si_scroll.mjs");
}

if (fallos) {
  console.error(`assert_inicio_hoy_si_scroll: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_inicio_hoy_si_scroll");
