/**
 * Assert: módulos de features expertas presentes (batimetría/radar/solunar/GPX/PescaREC/…).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const required = [
  "src/services/solunarService.ts",
  "src/services/tideService.ts",
  "src/services/radarService.ts",
  "src/services/gpxService.ts",
  "src/services/fishIdService.ts",
  "src/services/pescaRecService.ts",
  "src/services/trackService.ts",
  "src/services/offlineMapService.ts",
  "src/services/cupoService.ts",
  "src/data/concursos.ts",
  "src/data/permisosCoto.ts",
  "src/data/modalidades.ts",
  "src/components/PescaRecBanner.tsx",
  "src/components/VentanasSolunarMarea.tsx",
  "src/components/CalendarioConcursos.tsx",
  "src/components/IdentificarEspecie.tsx",
  "src/components/PanelOfflineMapa.tsx",
  "src/components/SelectorModalidad.tsx",
  "src/components/PanelCampoHoy.tsx",
];

let fallos = 0;
for (const rel of required) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    console.error(`FAIL missing ${rel}`);
    fallos++;
  }
}

const consulta = fs.readFileSync(path.join(root, "src/services/consultaPescaService.ts"), "utf8");
if (!consulta.includes("fuenteNormativaDetalle")) {
  console.error("FAIL ConsultaPesca sin fuenteNormativaDetalle");
  fallos++;
}

const mapWeb = fs.readFileSync(path.join(root, "src/components/map/index.web.tsx"), "utf8");
if (!mapWeb.includes("showRadar") || !mapWeb.includes("Polyline")) {
  console.error("FAIL mapa web sin radar/Polyline");
  fallos++;
}

const card = fs.readFileSync(path.join(root, "src/components/ConsultaPescaCard.tsx"), "utf8");
if (!card.includes("PescaRecBanner") || !card.includes("consultadoEn")) {
  console.error("FAIL ConsultaPescaCard sin PescaREC / fecha normativa");
  fallos++;
}

const pkg = fs.readFileSync(path.join(root, "package.json"), "utf8");
if (!pkg.includes("assert_features_expertas.mjs")) {
  console.error("FAIL package.json sin assert_features_expertas");
  fallos++;
}

const home = fs.readFileSync(path.join(root, "src/screens/HomeScreen.tsx"), "utf8");
if (!home.includes("PanelCampoHoy")) {
  console.error("FAIL HomeScreen sin PanelCampoHoy");
  fallos++;
}
if (!home.includes("rafagaKmh") && !home.includes("rafagaMaxKmh")) {
  console.error("FAIL HomeScreen sin ráfagas en alertas/clima");
  fallos++;
}

const catches = fs.readFileSync(path.join(root, "src/screens/MyCatchesScreen.tsx"), "utf8");
if (!catches.includes("Exportar GPX") || !catches.includes("filtroAmbito")) {
  console.error("FAIL MyCatches sin GPX visible o filtro modalidad por provincia");
  fallos++;
}

const prev = fs.readFileSync(path.join(root, "src/screens/PrevisionScreen.tsx"), "utf8");
if (!prev.includes("VentanasSolunarMarea") || !prev.includes('variante="glass"')) {
  console.error("FAIL Previsión sin solunar glass visible");
  fallos++;
}

const license = fs.readFileSync(path.join(root, "src/screens/LicenseScreen.tsx"), "utf8");
if (!license.includes("PescaRecBanner") || !license.includes("infoPermisoCoto")) {
  console.error("FAIL LicenseScreen sin PescaREC / permisos coto");
  fallos++;
}

const mapa = fs.readFileSync(path.join(root, "src/screens/ZonasLibresScreen.tsx"), "utf8");
if (!mapa.includes("activarRadar") || !mapa.includes("Radar lluvia")) {
  console.error("FAIL Mapa sin activarRadar / etiqueta Radar lluvia");
  fallos++;
}

const campo = fs.readFileSync(path.join(root, "src/components/PanelCampoHoy.tsx"), "utf8");
if (campo.includes('navigate("Prevision")') || !campo.includes('"Previsión"')) {
  console.error("FAIL PanelCampoHoy debe navegar a la pestaña Previsión (con tilde)");
  fallos++;
}
if (!campo.includes("activarRadar: true")) {
  console.error("FAIL PanelCampoHoy sin activarRadar: true");
  fallos++;
}
if (!campo.includes("abrirIdentificar") || !campo.includes("EspeciesMain")) {
  console.error("FAIL PanelCampoHoy sin enlace a identificar especie / catálogo Especies");
  fallos++;
}
if (!campo.includes("Para salir hoy") || !campo.includes("Más herramientas de campo")) {
  console.error("FAIL PanelCampoHoy debe mostrar ritual «Para salir hoy» con herramientas plegadas");
  fallos++;
}

const catchesNav = fs.readFileSync(path.join(root, "src/screens/MyCatchesScreen.tsx"), "utf8");
if (!catchesNav.includes("abrirIdentificar")) {
  console.error("FAIL MyCatches sin abrirIdentificar desde Campo de hoy");
  fallos++;
}

const tide = fs.readFileSync(path.join(root, "src/services/tideService.ts"), "utf8");
if (tide.includes("sevilla_costa_ref")) {
  console.error("FAIL tideService no debe cruzar referencia atlántica en Sevilla continental");
  fallos++;
}

if (fallos) {
  console.error(`assert_features_expertas: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_features_expertas");
