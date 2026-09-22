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

const logo = fs.readFileSync(path.join(root, "src/components/LogoMarca.tsx"), "utf8");
for (const n of ["mark.png", "animar", "LogoMarcaEstatico"]) {
  if (!logo.includes(n)) fail(`LogoMarca sin ${n}`);
}

const appTsx = fs.readFileSync(path.join(root, "App.tsx"), "utf8");
if (!appTsx.includes("PantallaLogoApertura") || !appTsx.includes("LOGO_APERTURA_MS")) {
  fail("App debe mostrar PantallaLogoApertura con duración mínima al abrir");
}
if (!appTsx.includes("aperturaT0")) {
  fail("App debe cronometrar la apertura desde el arranque");
}

const splash = fs.readFileSync(path.join(root, "src/components/PantallaLogoApertura.tsx"), "utf8");
for (const n of ["LOGO_APERTURA_MS", "LogoMarca", "OndaAgua", "pantalla completa", "listoParaSalir"]) {
  if (!splash.includes(n)) fail(`PantallaLogoApertura sin ${n}`);
}

const sel = fs.readFileSync(path.join(root, "src/screens/SelectorProvinciaScreen.tsx"), "utf8");
if (!sel.includes("LogoMarca") || !sel.includes("Tu cuaderno de orilla")) {
  fail("Selector debe invitar con logo + eslogan");
}

const onb = fs.readFileSync(path.join(root, "src/screens/OnboardingScreen.tsx"), "utf8");
if (!onb.includes("LogoMarca")) fail("Onboarding debe mostrar logo de marca");

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

if (fallos) {
  console.error(`assert_logo_marca: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_logo_marca");
