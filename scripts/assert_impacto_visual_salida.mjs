/**
 * Assert: impacto visual orientado a preparar salidas.
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

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function must(rel, needles) {
  const t = read(rel);
  for (const n of needles) {
    if (!t.includes(n)) fail(`${rel} sin «${n}»`);
  }
}

must("src/components/OndaAgua.tsx", ["OndaAgua", "Animated.loop", "shore"]);
must("src/components/PasoSalida.tsx", ["PasoSalida", "progressbar", "sobreOscuro"]);
must("src/theme.ts", ["FONTS", "SourceSans3_800ExtraBold"]);

must("src/screens/HomeScreen.tsx", [
  "AtmosferaMeteo",
  "SiguientePasoCard",
  "ctaSalgoTitle",
  "Salgo a pescar",
  "Punto del día y qué llevar",
  "FONTS",
]);
must("src/components/SiguientePasoCard.tsx", [
  "OndaAgua",
  "Siguiente paso",
  "Registrar salida de hoy",
  "Salida de hoy",
]);

must("src/screens/SalgoAPescarScreen.tsx", [
  "PasoSalida",
  "OndaAgua",
  "methodGlyph",
  "labelsPaso",
  "Continuar → clima",
  "Qué llevar →",
]);

must("src/components/ChecklistInteractivo.tsx", [
  "Listo para salir",
  "Preparación",
  "barraFill",
]);

must("src/screens/OnboardingScreen.tsx", ["OndaAgua", "FONTS"]);
must("src/screens/PrimeraSalidaScreen.tsx", ["OndaAgua", "FONTS"]);
must("src/components/RecomendacionHoyCard.tsx", ["OndaAgua"]);

const pkg = read("package.json");
if (!pkg.includes("assert_impacto_visual_salida.mjs")) {
  fail("package.json assert debe incluir assert_impacto_visual_salida.mjs");
}

if (fallos) {
  console.error(`assert_impacto_visual_salida: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_impacto_visual_salida");
