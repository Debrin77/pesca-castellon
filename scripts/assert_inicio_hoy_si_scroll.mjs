/**
 * Assert: chip HOY SÍ / veredictoRapido hace scroll fiable al «Detalle del tramo».
 * - Ancla fuera de ListaAnimada (onLayout con y real respecto al body)
 * - measureInWindow + offset de scroll (no solo heroH + y≈0)
 * - Orden ritual: Salgo → Detalle del tramo (cerca del hero, sin saltar a medias)
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
  "Detalle del tramo",
  "collapsable={false}",
  "mostrarAprende",
  "indexHint",
]) {
  if (!home.includes(needle)) fail(`HomeScreen sin ${needle}`);
}

// El ancla debe medir fuera de ListaAnimada (evita y≈0)
const iTitulo = home.indexOf('bloqueTitulo}>Detalle del tramo');
const ventana = home.slice(Math.max(0, iTitulo - 500), iTitulo + 40);
if (iTitulo < 0 || !ventana.includes("ref={tramoAnchorRef}")) {
  fail("El ancla del detalle del tramo debe envolver el bloque (ref={tramoAnchorRef})");
}

const iSalgo =
  home.indexOf("<SiguientePasoCard") >= 0
    ? home.indexOf("<SiguientePasoCard")
    : home.indexOf("Abrir Salgo a pescar");
if (!(iSalgo >= 0 && iTitulo > iSalgo)) {
  fail("Detalle del tramo debe ir después del CTA principal (Siguiente paso / Salgo)");
}

// Aprende / recomendación vacía no deben empujar el detalle lejos del chip
const iAprende = home.indexOf("<BloqueAprende");
const iRec = home.indexOf("<RecomendacionHoyCard");
if (iAprende > 0 && iTitulo > 0 && !(iTitulo < iAprende)) {
  fail("Detalle del tramo debe ir antes de BloqueAprende (menos salto al pulsar HOY SÍ)");
}
if (iRec > 0 && iTitulo > 0 && !(iTitulo < iRec)) {
  fail("Detalle del tramo debe ir antes de RecomendacionHoyCard");
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
