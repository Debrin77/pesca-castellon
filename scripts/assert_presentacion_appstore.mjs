/**
 * Assert: presentación estilo App Store al entrar (4 virtudes + ✕ + PIN).
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

must("src/screens/OnboardingScreen.tsx", [
  "Presentación estilo App Store",
  "✕",
  "Cerrar presentación",
  "PIN + biometría",
  "Personal e íntima",
  "pagingEnabled",
  "PHONE_H",
  "marcarPresentacionVirtudesVista",
  "OndaAgua",
  "FONTS",
  "FONTS.display",
  "SIN TRAMO",
  "MockUI",
  "Animated",
  "PulsePress",
  "HOY SÍ",
  "MapaIgnPresentacion",
  "primera salida",
  "¿Puedo aquí?",
  "Hoy pinta",
  "Mis sitios",
  "Salgo a pescar",
  "Vámonos de pesca",
  "Río · Embalse · Kayak · Mar",
  "Río · Embalse · Kayak",
  "Oficial / orientativo",
  "Desliza para ver",
  'id: "legal"',
  'id: "pinta"',
  'id: "sitios"',
  'id: "campo"',
  "Solunar",
  "FondoCinePresentacion",
  "Castellón · Sevilla · Córdoba · Cuenca",
  "surfcasting-orilla",
  "rockfishing-roca",
  "Long-press",
]);

must("src/components/FondoCinePresentacion.tsx", [
  "FondoCinePresentacion",
  "Ken Burns",
  "crossfade",
]);

must("src/components/MapaIgnPresentacion.tsx", [
  "MapaIgnPresentacion",
  "Curvas de nivel",
  "1 km",
]);

must("src/theme.ts", ["display:", "Fraunces_700Bold", "Fraunces_600SemiBold", "brand:"]);

must("App.tsx", [
  "presentacionVirtudesVista",
  "OnboardingScreen",
  "PantallaBloqueo",
  "PantallaLogoApertura",
  "LOGO_APERTURA_MS",
  "mostrarOnboarding",
  "Fraunces_700Bold",
  "Fraunces_600SemiBold",
]);

must("src/components/PantallaBloqueo.tsx", [
  "Introduce tu PIN",
  "desbloquearConContrasena",
  "desbloquearConBiometria",
  "TECLAS",
  "biometriaActiva",
]);

must("src/screens/AjustesScreen.tsx", [
  "Bloqueo con PIN",
  "setBiometriaActiva",
  "reiniciarPresentacionVirtudes",
  "Ver presentación otra vez",
  "esPinValido",
]);

must("src/services/offlineService.ts", [
  "presentacionVirtudesVista",
  "marcarPresentacionVirtudesVista",
  "reiniciarPresentacionVirtudes",
  "presentacion_virtudes_v5",
]);

must("README.md", [
  "Presentación estilo App Store",
  "PIN",
  "biometría",
  "Castellón",
  "Sevilla",
  "personal",
  "Kayak es modalidad propia",
  "fondos fotográficos",
]);

must("src/data/iconosPunto.ts", ["COLORES_PUNTO", "ICONOS_PUNTO", "hexColorPunto"]);
must("src/components/GuardarPuntoSheet.tsx", ["Guardar punto", "Guardar en mis sitios"]);
must("src/components/MapaFabHerramientas.tsx", ["Herramientas del mapa", "Medir", "Guardar"]);

const mapa = read("src/screens/ZonasLibresScreen.tsx");
for (const n of [
  "alLongPressMapa",
  "GuardarPuntoSheet",
  "MapaFabHerramientas",
  "basemapSatelite",
  "Normativa",
  "PinPuntoPersonal",
  "mapType",
]) {
  if (!mapa.includes(n)) fail(`ZonasLibresScreen sin «${n}»`);
}

const pkg = read("package.json");
if (!pkg.includes("assert_presentacion_appstore.mjs")) {
  fail("package.json assert debe incluir assert_presentacion_appstore.mjs");
}

if (fallos) {
  console.error(`assert_presentacion_appstore: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_presentacion_appstore");
