/**
 * Assert: ritual de pesca UX — Inicio ordenado, 5 tabs, Ahora compacto, mapa con capas plegadas.
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

// Hero: pulso (índice protagonista) + marca + veredicto rápido del punto
if (!home.includes("brandPulse") || !home.includes("pulsoRow") || !home.includes("pulsoIndice")) {
  fail("HomeScreen sin hero Pulso del día (brandPulse / pulsoRow)");
}
if (!home.includes("veredictoRapido") || !home.includes("abrirVeredictoRapido")) {
  fail("HomeScreen sin veredicto rápido en el hero (gesto Inicio → detalle)");
}

// Orden: Salgo a pescar antes de PanelCampoHoy; Tu tramo antes que Ahora
const iSalgo = home.indexOf("Salgo a pescar");
const iTramo = home.indexOf("Tu tramo");
const iAntes = home.indexOf("Antes de salir");
const iSitios = home.indexOf("Tus sitios");
const iCampo = home.indexOf("<PanelCampoHoy");
if (iSalgo < 0 || iTramo < 0 || iCampo < 0 || !(iSalgo < iTramo && iTramo < iCampo)) {
  fail("HomeScreen orden ritual: Salgo → Tu tramo → PanelCampoHoy");
}
if (iAntes > 0 && iSitios > 0 && !(iAntes < iCampo)) {
  fail("HomeScreen: Antes de salir debería ir antes de Campo/Ahora");
}

// Ahora compacto
if (!campo.includes("Para salir hoy") || !campo.includes("Más herramientas de campo")) {
  fail("PanelCampoHoy debe ser ritual «Para salir hoy» con más herramientas plegadas");
}
if (!campo.includes("trioCard") || !campo.includes("activarRadar: true") || !campo.includes("abrirIdentificar")) {
  fail("PanelCampoHoy sin trio de acciones (solunar / radar / ID)");
}

// 5 tabs visibles
const tabScreens = [...app.matchAll(/<Tab\.Screen name="([^"]+)"/g)].map((m) => m[1]);
const esperadas = ["Inicio", "Mapa", "Especies", "Previsión", "Capturas"];
if (tabScreens.length !== 5 || esperadas.some((t, i) => tabScreens[i] !== t)) {
  fail(`App tabs visibles deben ser ${esperadas.join(" · ")} (got ${tabScreens.join(" · ")})`);
}
if (app.includes('name="Aparejos" component={AparejosStackScreen}') || app.includes("AparejosStackScreen")) {
  fail("Aparejos no debe ser tab; va en stacks Home/Especies/Mapa");
}
if (!app.includes('HomeStack.Screen name="Aparejos"') || !app.includes('HomeStack.Screen name="Consejos"')) {
  fail("HomeStack debe incluir Aparejos y Consejos");
}

// Barra: 5 iconos, sin Aparejos/Consejos en ICONO_POR_TAB
if (tabs.includes("Aparejos:") || tabs.includes("Consejos:")) {
  fail("BarraTabsScroll no debe mapear tabs Aparejos/Consejos");
}
if (!tabs.includes("ANCHO_ITEM = 78")) {
  fail("BarraTabsScroll debería usar ANCHO_ITEM = 78 para 5 tabs");
}

// Mapa: capas plegadas
if (!mapa.includes("capasExtra") || !mapa.includes("Más capas")) {
  fail("Mapa sin capasExtra / Más capas");
}

if (fallos) {
  console.error(`assert_ritual_ux: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_ritual_ux");
