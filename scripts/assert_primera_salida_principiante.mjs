/**
 * Assert: flujo principiante (puntos 1–9).
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

must("src/screens/PrimeraSalidaScreen.tsx", [
  "sitiosFacilesDe",
  "ap-kit-principiante",
  "nudo-palomar",
  "PescaREC",
  "marcarPrimeraSalidaHecha",
  "Seguir sin sitio concreto",
  "Usar este sitio · seguir",
]);

// El CTA «Seguir sin sitio concreto» no debe quedar disabled cuando hay opciones.
{
  const t = read("src/screens/PrimeraSalidaScreen.tsx");
  const i = t.indexOf("Seguir sin sitio concreto");
  if (i < 0) fail("PrimeraSalidaScreen sin «Seguir sin sitio concreto»");
  else {
    const ventana = t.slice(Math.max(0, i - 280), i + 80);
    if (
      /disabled=\{sitiosVisibles\.length > 0 && !sitio\}/.test(ventana) ||
      /disabled=\{sitiosVisibles\.length > 0 && !sitio\}/.test(t)
    ) {
      fail("«Seguir sin sitio concreto» no debe desactivarse si hay sitios visibles");
    }
  }
}

must("src/screens/HomeScreen.tsx", [
  "BannerLicenciaPendiente",
  "BloqueAprende",
  "SheetPermisoGps",
  "PrimeraSalida",
  "pedirGpsConSheet",
  "primeraSalidaHecha",
]);

must("src/components/SemaforoVeredicto.tsx", ["SIN TRAMO", "No es veda", "cartel"]);

must("src/data/certezaConsulta.ts", [
  'fuenteGeometria === "ninguna"',
  "No es veda automática",
  "5.2",
]);

must("src/screens/OnboardingScreen.tsx", ["SIN TRAMO", "primera salida", "cartel"]);

must("src/components/ChecklistInteractivo.tsx", [
  "itemsDesdeTextos",
  "pesca_rec",
  "abrirPescaRecTienda",
]);

must("src/screens/SalgoAPescarScreen.tsx", [
  "ChecklistInteractivo",
  "sitiosFaciles",
  "PescaREC",
  "SheetPermisoGps",
  "pedirGpsConSheet",
]);

must("src/data/sitiosFaciles.ts", ["embalse_sichar", "embalse_de_cala", "sitiosFacilesDe"]);

must("src/components/BannerLicenciaPendiente.tsx", ["licencia", "Ya la tengo"]);

must("src/components/BloqueAprende.tsx", ["Aprende", "Kit", "Palomar", "Sitios"]);

must("src/components/SheetPermisoGps.tsx", ["GPS", "Continuar"]);

must("App.tsx", ["PrimeraSalida", "PrimeraSalidaScreen"]);

const pkg = read("package.json");
if (!pkg.includes("assert_primera_salida_principiante.mjs")) {
  fail("package.json assert debe incluir assert_primera_salida_principiante.mjs");
}

if (fallos) {
  console.error(`assert_primera_salida_principiante: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_primera_salida_principiante");
