/**
 * Assert: logo parche bordado como marca (icono, splash, puerta, Inicio).
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

const app = fs.readFileSync(path.join(root, "app.json"), "utf8");
for (const n of [
  '"./assets/brand/icon.png"',
  '"./assets/brand/splash-logo.png"',
  '"./assets/brand/adaptive-icon.png"',
  '"./assets/brand/favicon.png"',
  '"#0c2c20"',
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
  "Bitácora",
  "de pesca",
  "FONTS.brand",
  "useWindowDimensions",
  "hiRes",
  "marcaLead",
  "marcaTrail",
]) {
  if (!splash.includes(n)) fail(`PantallaLogoApertura sin ${n}`);
}
if (splash.includes("eslogan") || splash.includes("¿Puedo? ¿Pinta? Sal.")) {
  fail("PantallaLogoApertura debe mostrar solo el wordmark, sin eslogan");
}
const durMatch = splash.match(/LOGO_APERTURA_MS\s*=\s*(\d+)/);
if (!durMatch || Number(durMatch[1]) < 4000) {
  fail("LOGO_APERTURA_MS debe durar ≥4s para poder leer el wordmark");
}

const logo = fs.readFileSync(path.join(root, "src/components/LogoMarca.tsx"), "utf8");
for (const n of ["mark.png", "logo.png", "animar", "LogoMarcaEstatico", "hiRes"]) {
  if (!logo.includes(n)) fail(`LogoMarca sin ${n}`);
}

const theme = fs.readFileSync(path.join(root, "src/theme.ts"), "utf8");
if (!theme.includes("Syne_800ExtraBold") || !theme.includes("brand:")) {
  fail("theme debe definir FONTS.brand con Syne (bitácora de pesca)");
}

const appFonts = fs.readFileSync(path.join(root, "App.tsx"), "utf8");
if (!appFonts.includes("PantallaLogoApertura") || !appFonts.includes("LOGO_APERTURA_MS")) {
  fail("App debe mostrar PantallaLogoApertura con duración mínima al abrir");
}
if (!appFonts.includes("aperturaT0")) {
  fail("App debe cronometrar la apertura desde el arranque");
}
if (!appFonts.includes("Syne_800ExtraBold")) {
  fail("App debe cargar Syne para el wordmark de apertura");
}

const web = fs.readFileSync(path.join(root, "src/webChrome.ts"), "utf8");
if (!web.includes("Syne")) {
  fail("webChrome debe cargar Syne en web");
}

const sel = fs.readFileSync(path.join(root, "src/screens/SelectorProvinciaScreen.tsx"), "utf8");
if (!sel.includes("LogoMarca") || !sel.includes("Bitácora") || !sel.includes("de pesca")) {
  fail("Selector debe invitar con logo + wordmark Bitácora de pesca");
}
if (sel.includes("eslogan") || sel.includes("¿Puedo? ¿Pinta? Sal.")) {
  fail("Selector no debe mostrar eslogan bajo la marca");
}

const onb = fs.readFileSync(path.join(root, "src/screens/OnboardingScreen.tsx"), "utf8");
if (!onb.includes("LogoMarca")) fail("Onboarding debe mostrar logo de marca");
if (!onb.includes("Bitácora de pesca")) fail("Onboarding debe mostrar wordmark Bitácora de pesca");
if (onb.includes("brandTag") || onb.includes("¿Puedo? ¿Pinta? Sal.")) {
  fail("Onboarding no debe mostrar eslogan bajo la marca");
}

const home = fs.readFileSync(path.join(root, "src/screens/HomeScreen.tsx"), "utf8");
if (!home.includes("LogoMarcaEstatico") || !home.includes("brandRow")) {
  fail("Inicio debe llevar marca (logo) como hero, sin texto del nombre");
}
if (/brandPulse\}>\s*\{provincia\.nombreApp\}/.test(home) || /\{provincia\.nombreApp\}<\/Text>/.test(home.replace(/accessibilityLabel=\{provincia\.nombreApp\}/g, ""))) {
  // Allow accessibilityLabel; forbid visible Text with nombreApp in hero brand
  const heroSlice = home.slice(
    home.indexOf("<AtmosferaMeteo"),
    home.indexOf("veredictoRapido") > 0 ? home.indexOf("veredictoRapido") : home.length
  );
  if (heroSlice.includes("{provincia.nombreApp}") && heroSlice.includes("</Text>")) {
    fail("Hero de Inicio no debe renderizar el texto del nombre de app");
  }
}

const pkg = fs.readFileSync(path.join(root, "package.json"), "utf8");
if (!pkg.includes("assert_logo_marca.mjs")) {
  fail("package.json debe incluir assert_logo_marca.mjs");
}
if (!pkg.includes("@expo-google-fonts/syne")) {
  fail("package.json debe incluir @expo-google-fonts/syne");
}

if (fallos) {
  console.error(`assert_logo_marca: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_logo_marca");
