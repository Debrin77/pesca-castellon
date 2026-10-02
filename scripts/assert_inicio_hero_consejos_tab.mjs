/**
 * Assert: Hoy con hero claro (marca + veredicto + CTA) y barra tipo tienda (5 tabs).
 * Consejos ya no es pestaña: vive en stacks + Guía.
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
const app = read("App.tsx");
const tabs = read("src/components/BarraTabsScroll.tsx");
const ir = read("src/navigation/irATab.ts");
const consejos = read("src/screens/ConsejosScreen.tsx");
const salgo = read("src/screens/SalgoAPescarScreen.tsx");

if (!home.includes("LogoMarcaEstatico") && !home.includes("FONTS.display") && !home.includes("TYPE.displayHero")) {
  fail("Home debe usar logo de marca o Fraunces en el hero");
}
if (!home.includes("brandMark") || !home.includes("veredictoRapido") || !home.includes("ctaSalgoTitle")) {
  fail("Home hero debe tener marca (logo) + veredicto + CTA Salgo");
}
const iBrand = home.indexOf("brandMark");
const iVer = home.indexOf("veredictoRapido");
const iCta = home.indexOf("ctaSalgoTitle");
if (!(iBrand < iVer && iVer < iCta)) fail("Orden hero: marca → veredicto → CTA");
if (home.includes("styles.brandPulse") && /brandPulse\}>\{provincia\.nombreApp/.test(home)) {
  fail("Home no debe mostrar el texto del nombre de app en el hero (solo logo)");
}
if (!home.includes("irAConsejos") || !home.includes("guiaChip")) {
  fail("Hoy debe exponer Guía (Consejos) sin saturar el hero");
}
if (!home.includes('navigate("Aparejos"') || !home.includes('navigate("License")')) {
  fail("Hoy debe exponer Aparejos/Licencia en Guía");
}
if (home.includes("Pulso del día") || home.includes("<TarjetaPuntoHoy")) {
  fail("Pulso/tarjeta detallados no deben vivir en Hoy (van a Previsión / hero)");
}

const tabScreens = [...app.matchAll(/<Tab\.Screen name="([^"]+)"/g)].map((m) => m[1]);
const esperadas = ["Inicio", "Mapa", "Especies", "Previsión", "Capturas"];
if (tabScreens.join() !== esperadas.join()) {
  fail(`Tabs deben ser ${esperadas.join(" · ")} (got ${tabScreens.join(" · ")})`);
}
if (tabs.includes("Consejos:")) fail("BarraTabsScroll no debe iconar Consejos como tab");
if (app.includes("ConsejosStackScreen") || app.includes('name="ConsejosMain"')) {
  fail("Consejos no debe ser stack-tab; va anidado en Hoy/Mapa/Especies");
}
if (!app.includes('HomeStack.Screen name="Consejos"')) {
  fail("HomeStack debe incluir pantalla Consejos");
}
if (!ir.includes("irAConsejos") || !ir.includes('"Consejos"')) fail("irATab debe exponer irAConsejos");
if (!consejos.includes("FONTS.display") && !consejos.includes("TYPE.displayHero")) fail("Consejos hero debe usar Fraunces");
if (!salgo.includes("FONTS.display") && !salgo.includes("TYPE.displayHero") && !salgo.includes("TYPE.displayTitle")) fail("Salgo a pescar título debe usar Fraunces");

const pkg = read("package.json");
if (!pkg.includes("assert_inicio_hero_consejos_tab.mjs")) {
  fail("package.json assert debe incluir assert_inicio_hero_consejos_tab.mjs");
}

if (fallos) {
  console.error(`assert_inicio_hero_consejos_tab: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK: hero Hoy + barra 5 tabs (Consejos en Guía)");
