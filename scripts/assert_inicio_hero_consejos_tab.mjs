/**
 * Assert: Inicio con hero claro (marca + veredicto + CTA) y tab Consejos.
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
if (!home.includes("atajosPunto") || !home.includes("irAConsejos")) {
  fail("Con punto elegido, Inicio debe mostrar atajos Aparejos/Consejos");
}
if (!home.includes("pulsoCard") || !home.includes("pulsoRow")) {
  fail("Pulso meteo debe quedar bajo el hero (pulsoCard) manteniendo pulsoRow");
}

const tabScreens = [...app.matchAll(/<Tab\.Screen name="([^"]+)"/g)].map((m) => m[1]);
const esperadas = ["Inicio", "Mapa", "Especies", "Consejos", "Previsión", "Capturas"];
if (tabScreens.join() !== esperadas.join()) {
  fail(`Tabs deben ser ${esperadas.join(" · ")} (got ${tabScreens.join(" · ")})`);
}
if (!tabs.includes("Consejos:") || !tabs.includes('"book"')) fail("BarraTabsScroll debe iconar Consejos");
if (!app.includes("ConsejosStackScreen") || !app.includes('name="ConsejosMain"')) {
  fail("App debe tener stack ConsejosMain");
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
console.log("OK: hero Inicio + tab Consejos");
