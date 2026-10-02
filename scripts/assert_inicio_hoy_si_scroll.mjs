/**
 * Assert: chip HOY SÍ / veredictoRapido hace scroll fiable a «Detalle y avisos».
 * - Ancla con onLayout + measureInWindow
 * - Orden ritual: Salgo → Detalle y avisos (cerca del hero)
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
  "Detalle y avisos",
  "collapsable={false}",
  "mostrarAprende",
  "indexHint",
]) {
  if (!home.includes(needle)) fail(`HomeScreen sin ${needle}`);
}

const iTitulo = home.indexOf("bloqueTitulo}>Detalle y avisos");
const ventana = home.slice(Math.max(0, iTitulo - 1200), iTitulo + 40);
if (iTitulo < 0 || !ventana.includes("ref={tramoAnchorRef}")) {
  fail("El ancla del detalle debe envolver el bloque (ref={tramoAnchorRef})");
}
if (iTitulo < 0 || !ventana.includes("bloqueCabecera")) {
  fail("Detalle y avisos debe ser cabecera desplegable (bloqueCabecera)");
}

const iSalgo =
  home.indexOf("ctaSalgoTitle") >= 0
    ? home.indexOf("ctaSalgoTitle")
    : home.indexOf("<SiguientePasoCard") >= 0
      ? home.indexOf("<SiguientePasoCard")
      : home.indexOf("Abrir Salgo a pescar");
if (!(iSalgo >= 0 && iTitulo > iSalgo)) {
  fail("Detalle y avisos debe ir después del CTA Salgo a pescar");
}

if (home.includes("<BloqueAprende") || home.includes("<RecomendacionHoyCard")) {
  fail("Hoy no debe montar BloqueAprende ni RecomendacionHoyCard (viven en Consejos/Mapa)");
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
