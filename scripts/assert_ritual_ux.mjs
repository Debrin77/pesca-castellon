/**
 * Assert: ritual de pesca UX — Inicio completo organizado, 6 tabs, Ahora compacto, mapa con capas plegadas.
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
const campo = fs.readFileSync(path.join(root, "src/components/PanelCampoHoy.tsx"), "utf8");
const app = fs.readFileSync(path.join(root, "App.tsx"), "utf8");
const mapa = fs.readFileSync(path.join(root, "src/screens/ZonasLibresScreen.tsx"), "utf8");
const tabs = fs.readFileSync(path.join(root, "src/components/BarraTabsScroll.tsx"), "utf8");

// Hero: marca + veredicto + ¿Pinta? + CTA
if (!home.includes("brandMark") || !home.includes("pintaHeroLine")) {
  fail("HomeScreen sin hero (brandMark / pintaHeroLine)");
}
if (!home.includes("veredictoRapido") || !home.includes("abrirVeredictoRapido")) {
  fail("HomeScreen sin veredicto rápido en el hero (gesto → detalle)");
}
if (!home.includes("pulsoRow") || !home.includes("pulsoIndice") || !home.includes("Pulso del día")) {
  fail("HomeScreen debe mostrar Pulso del día (pulsoRow / pulsoIndice)");
}

// Orden: CTA Salgo → siguiente paso → Ideas/PanelExplorar → Más de hoy
const iSalgo =
  home.indexOf("ctaSalgoTitle") >= 0
    ? home.indexOf("ctaSalgoTitle")
    : home.indexOf("<SiguientePasoCard") >= 0
      ? home.indexOf("<SiguientePasoCard")
      : home.indexOf("Abrir Salgo a pescar");
const iPaso = home.indexOf("<SiguientePasoCard");
const iExplorar = home.indexOf("<PanelExplorarSitios");
const iDetalle = home.indexOf("Más de hoy");
if (iSalgo < 0 || iDetalle < 0 || !(iSalgo < iDetalle)) {
  fail("HomeScreen orden ritual: Salgo a pescar → Más de hoy");
}
if (iPaso >= 0 && !(iSalgo < iPaso && iPaso < iDetalle)) {
  fail("HomeScreen orden: Salgo → Siguiente paso → Más de hoy");
}
if (iExplorar < 0 || !(iPaso < iExplorar && iExplorar < iDetalle)) {
  fail("HomeScreen: PanelExplorarSitios (SAIH/recomendaciones) entre Siguiente paso y Más de hoy");
}

const explorar = fs.readFileSync(path.join(root, "src/components/PanelExplorarSitios.tsx"), "utf8");
if (!explorar.includes("QuieroPescarBlock") || !explorar.includes("PanelCampoHoy") || !explorar.includes("Tus sitios")) {
  fail("PanelExplorarSitios debe agrupar QuieroPescar, Tus sitios y PanelCampoHoy");
}
if (!home.includes("<PanelExplorarSitios")) {
  fail("Inicio debe montar PanelExplorarSitios (contenido visible, no solo en Mapa)");
}
// Mapa también puede montarlo (acceso secundario); no se borra
if (!mapa.includes("PanelExplorarSitios")) {
  fail("Mapa debe seguir montando PanelExplorarSitios (sin borrar acceso)");
}

// Ahora compacto
if (!campo.includes("Para salir hoy") || !campo.includes("Más herramientas de campo")) {
  fail("PanelCampoHoy debe ser ritual «Para salir hoy» con más herramientas plegadas");
}
if (!campo.includes("trioCard") || !campo.includes("activarRadar: true") || !campo.includes("abrirIdentificar")) {
  fail("PanelCampoHoy sin trio de acciones (solunar / radar / ID)");
}

// 6 tabs (Consejos incluido; no «modo tienda» de 5)
const tabScreens = [...app.matchAll(/<Tab\.Screen name="([^"]+)"/g)].map((m) => m[1]);
const esperadas = ["Inicio", "Mapa", "Especies", "Consejos", "Previsión", "Capturas"];
if (tabScreens.length !== 6 || esperadas.some((t, i) => tabScreens[i] !== t)) {
  fail(`App tabs visibles deben ser ${esperadas.join(" · ")} (got ${tabScreens.join(" · ")})`);
}
if (app.includes('name="Aparejos" component={AparejosStackScreen}') || app.includes("AparejosStackScreen")) {
  fail("Aparejos no debe ser tab; va en stacks Home/Especies/Mapa");
}
if (!app.includes('HomeStack.Screen name="Aparejos"') || !app.includes('HomeStack.Screen name="Consejos"')) {
  fail("HomeStack debe incluir Aparejos y Consejos");
}

// Barra: Aparejos fuera; Consejos sí es tab
if (tabs.includes("Aparejos:")) {
  fail("BarraTabsScroll no debe mapear tab Aparejos");
}
if (!tabs.includes("Consejos:")) {
  fail("BarraTabsScroll debe mapear tab Consejos");
}
if (!tabs.includes("ANCHO_ITEM = 78")) {
  fail("BarraTabsScroll debería usar ANCHO_ITEM = 78 (6 tabs con scroll)");
}

// Mapa: capas plegadas + cierre visible
if (!mapa.includes("capasExtra") || !mapa.includes("Más capas")) {
  fail("Mapa sin capasExtra / Más capas");
}
if (!mapa.includes("Cerrar ▲") || !mapa.includes("Cerrar más capas") || !mapa.includes("cerrarCapasBtn")) {
  fail("Mapa debe poder cerrar «Más capas» con control visible (Cerrar)");
}

if (fallos) {
  console.error(`assert_ritual_ux: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_ritual_ux");
