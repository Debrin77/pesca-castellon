/**
 * Assert: logo parche bordado como marca (icono, splash, puerta, Inicio).
 * Wordmark «Vámonos de pesca» va en el propio asset del parche.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let fallos = 0;
function fail(m) {
  console.error("FAIL", m);
  fallos++;
}

const brand = path.join(root, "assets/brand");
for (const f of [
  "icon.png",
  "adaptive-icon.png",
  "splash-logo.png",
  "mark.png",
  "favicon.png",
  "logo.png",
  "ATTRIBUTION.md",
]) {
  if (!fs.existsSync(path.join(brand, f))) fail(`falta assets/brand/${f}`);
}

const attribution = fs.readFileSync(path.join(brand, "ATTRIBUTION.md"), "utf8");
if (!attribution.includes("VÁMONOS DE PESCA") && !attribution.includes("Vámonos de pesca")) {
  fail("ATTRIBUTION debe documentar el wordmark Vámonos de pesca en el parche");
}

const app = fs.readFileSync(path.join(root, "app.json"), "utf8");
for (const n of [
  '"./assets/brand/icon.png"',
  '"./assets/brand/splash-logo.png"',
  '"./assets/brand/adaptive-icon.png"',
  '"./assets/brand/favicon.png"',
  '"#0c2c20"',
  "Vámonos de pesca",
]) {
  if (!app.includes(n)) fail(`app.json sin ${n}`);
}

const splash = fs.readFileSync(path.join(root, "src/components/PantallaLogoApertura.tsx"), "utf8");
for (const n of [
  "LOGO_APERTURA_MS",
  "LogoMarca",
  "OndaAgua",
  "pantalla completa",
  "listoParaSalir",
  "Vámonos de pesca",
  "useWindowDimensions",
  "hiRes",
  "logoListo",
  "onListo",
]) {
  if (!splash.includes(n)) fail(`PantallaLogoApertura sin ${n}`);
}
if (splash.includes("eslogan") || splash.includes("¿Puedo? ¿Pinta? Sal.") || splash.includes("marcaLead")) {
  fail("PantallaLogoApertura: el wordmark va en el parche, sin texto UI duplicado ni eslogan");
}
if (!splash.includes("!listoParaSalir || !logoListo")) {
  fail("PantallaLogoApertura no debe cerrar el splash antes de que cargue el logo");
}
const durMatch = splash.match(/LOGO_APERTURA_MS\s*=\s*(\d+)/);
if (!durMatch || Number(durMatch[1]) < 4000) {
  fail("LOGO_APERTURA_MS debe durar ≥4s para poder leer el wordmark");
}

const logo = fs.readFileSync(path.join(root, "src/components/LogoMarca.tsx"), "utf8");
for (const n of [
  "mark.png",
  "logo.png",
  "animar",
  "LogoMarcaEstatico",
  "hiRes",
  "HIRES_MIN",
  "prefetchLogoMarca",
  "onLoad",
  "onListo",
  "resolveAssetSource",
]) {
  if (!logo.includes(n)) fail(`LogoMarca sin ${n}`);
}
if (!logo.includes("size >= HIRES_MIN ? LOGO_HI")) {
  fail("LogoMarcaEstatico/LogoMarca deben usar logo.png cuando el tamaño permite leer el wordmark");
}
if (!logo.includes("styles.clip") && !logo.includes("overflow: \"hidden\"")) {
  fail("LogoMarca debe recortar el círculo en un nodo sin transform (Safari iOS)");
}

const home = fs.readFileSync(path.join(root, "src/screens/HomeScreen.tsx"), "utf8");
if (!home.includes("LogoMarcaEstatico") || !home.includes("brandRow")) {
  fail("Inicio debe llevar marca (logo) como hero, sin texto del nombre");
}
const homeSize = home.match(/LogoMarcaEstatico\s+size=\{(\d+)\}/);
if (!homeSize || Number(homeSize[1]) < 120) {
  fail("Inicio: logo ≥120 px para que se lea VÁMONOS DE PESCA bordado");
}
if (!home.includes('accessibilityLabel="Vámonos de pesca"')) {
  fail("Inicio debe etiquetar la marca como Vámonos de pesca");
}
if (/brandPulse\}>\s*\{provincia\.nombreApp\}/.test(home) || /\{provincia\.nombreApp\}<\/Text>/.test(home.replace(/accessibilityLabel=\{provincia\.nombreApp\}/g, ""))) {
  const heroSlice = home.slice(
    home.indexOf("<AtmosferaMeteo"),
    home.indexOf("veredictoRapido") > 0 ? home.indexOf("veredictoRapido") : home.length
  );
  if (heroSlice.includes("{provincia.nombreApp}") && heroSlice.includes("</Text>")) {
    fail("Hero de Inicio no debe renderizar el texto del nombre de app");
  }
}

const theme = fs.readFileSync(path.join(root, "src/theme.ts"), "utf8");
if (!theme.includes("Syne_800ExtraBold") || !theme.includes("brand:")) {
  fail("theme debe definir FONTS.brand con Syne (vámonos de pesca)");
}

const appFonts = fs.readFileSync(path.join(root, "App.tsx"), "utf8");
if (!appFonts.includes("PantallaLogoApertura") || !appFonts.includes("LOGO_APERTURA_MS")) {
  fail("App debe mostrar PantallaLogoApertura con duración mínima al abrir");
}
if (!appFonts.includes("aperturaT0")) {
  fail("App debe cronometrar la apertura desde el arranque");
}
if (!appFonts.includes("Syne_800ExtraBold")) {
  fail("App debe cargar Syne para tipografía de marca");
}
if (!appFonts.includes("prefetchLogoMarca")) {
  fail("App debe precargar el logo al arrancar (prefetchLogoMarca)");
}

const web = fs.readFileSync(path.join(root, "src/webChrome.ts"), "utf8");
if (!web.includes("Syne")) {
  fail("webChrome debe cargar Syne en web");
}

const sel = fs.readFileSync(path.join(root, "src/screens/SelectorProvinciaScreen.tsx"), "utf8");
if (!sel.includes("LogoMarca") || !sel.includes("Vámonos de pesca")) {
  fail("Selector debe mostrar logo Vámonos de pesca");
}
if (sel.includes("brandLead") || sel.includes("eslogan") || sel.includes("¿Puedo? ¿Pinta? Sal.")) {
  fail("Selector: wordmark en el parche, sin texto UI duplicado ni eslogan");
}

const onb = fs.readFileSync(path.join(root, "src/screens/OnboardingScreen.tsx"), "utf8");
if (!onb.includes("LogoMarca")) fail("Onboarding debe mostrar logo de marca");
if (!onb.includes("Vámonos de pesca")) fail("Onboarding debe etiquetar logo Vámonos de pesca");
if (onb.includes("brandTag") || onb.includes("¿Puedo? ¿Pinta? Sal.")) {
  fail("Onboarding no debe mostrar eslogan bajo la marca");
}

const pkg = fs.readFileSync(path.join(root, "package.json"), "utf8");
if (!pkg.includes("assert_logo_marca.mjs")) {
  fail("package.json debe incluir assert_logo_marca.mjs");
}
if (!pkg.includes("@expo-google-fonts/syne")) {
  fail("package.json debe incluir @expo-google-fonts/syne");
}

// Assets de marca: no vacíos, y el PNG de UI debe caber en móvil (3G/4G).
for (const f of ["logo.png", "mark.png", "splash-logo.png", "icon.png"]) {
  const st = fs.statSync(path.join(brand, f));
  if (st.size < 8_000) fail(`${f} parece demasiado pequeño (${st.size} bytes)`);
}
const logoBytes = fs.statSync(path.join(brand, "logo.png")).size;
if (logoBytes > 350_000) {
  fail(`logo.png demasiado pesado para móvil (${logoBytes} bytes; máx 350KB)`);
}
const splashBytes = fs.statSync(path.join(brand, "splash-logo.png")).size;
if (splashBytes > 450_000) {
  fail(`splash-logo.png demasiado pesado (${splashBytes} bytes; máx 450KB)`);
}

if (fallos) {
  console.error(`assert_logo_marca: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_logo_marca");
