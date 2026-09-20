/**
 * Assert: tipografía accesible (WCAG-friendly) + atractiva.
 * Cuerpo ≥16, caption ≥14, overline ≥12, Fraunces display ≥22,
 * tope de escalado del sistema, sin ExtraBold en overlines.
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
function read(r) {
  return fs.readFileSync(path.join(root, r), "utf8");
}

const theme = read("src/theme.ts");
for (const k of [
  "MAX_FONT_SIZE_MULTIPLIER",
  "TYPE.meta",
  "export const TYPE",
  "displayVerdict",
  "displaySheet",
  "displayHero",
  "Source Sans 3",
  "Fraunces",
]) {
  if (!theme.includes(k) && !(k === "TYPE.meta" && theme.includes("meta:"))) {
    if (k === "TYPE.meta") {
      if (!theme.includes("meta:")) fail("theme TYPE falta meta");
      continue;
    }
    fail("theme falta " + k);
  }
}

if (!theme.includes("MAX_FONT_SIZE_MULTIPLIER = 1.3")) {
  fail("MAX_FONT_SIZE_MULTIPLIER debe ser 1.3");
}

// Extraer bloque TYPE y comprobar mínimos
const typeBlock = theme.slice(theme.indexOf("export const TYPE"), theme.indexOf("};", theme.indexOf("export const TYPE")) + 2);

function sizeOf(token) {
  const m = typeBlock.match(new RegExp(`${token}:\\s*\\{[\\s\\S]*?fontSize:\\s*(\\d+(?:\\.\\d+)?)`));
  return m ? Number(m[1]) : null;
}

const checks = [
  ["body", 16],
  ["bodyStrong", 16],
  ["caption", 14],
  ["overline", 12],
  ["meta", 14],
  ["mapChip", 14],
  ["mapLegend", 12],
  ["displaySheet", 22],
  ["displayTitle", 22],
  ["displayHero", 28],
  ["displayVerdict", 34],
];
for (const [token, min] of checks) {
  const n = sizeOf(token);
  if (n == null) fail(`TYPE.${token} sin fontSize`);
  else if (n < min) fail(`TYPE.${token} fontSize ${n} < mínimo ${min}`);
}

if (!typeBlock.includes("letterSpacing: 0.8") && !typeBlock.includes("letterSpacing:0.8")) {
  // displayVerdict tracking abierto
  const v = typeBlock.slice(typeBlock.indexOf("displayVerdict"));
  if (!/letterSpacing:\s*0\.[6-9]/.test(v) && !/letterSpacing:\s*[1-9]/.test(v)) {
    fail("displayVerdict debe abrir letterSpacing (cartelería)");
  }
}

// Overline: Bold, no ExtraBold
const over = typeBlock.slice(typeBlock.indexOf("overline:"), typeBlock.indexOf("mapChip:"));
if (over.includes("FONTS.extrabold") || over.includes("fontWeight: \"800\"")) {
  fail("overline no debe usar ExtraBold (demasiado grito)");
}

const app = read("App.tsx");
if (!app.includes("MAX_FONT_SIZE_MULTIPLIER") || !app.includes("maxFontSizeMultiplier")) {
  fail("App debe aplicar maxFontSizeMultiplier global");
}

const sel = read("src/screens/SelectorProvinciaScreen.tsx");
if (!sel.includes("TYPE.displayTitle") || !sel.includes("cardNombre")) {
  fail("Selector: nombre de provincia en display (Fraunces)");
}
if (!sel.includes("TYPE.body")) fail("Selector: subtítulo con TYPE.body");

const home = read("src/screens/HomeScreen.tsx");
if (!home.includes("TYPE.meta") && !home.includes("dateText")) {
  fail("Home fecha debe usar TYPE.meta");
}
if (home.includes("sectionTitle: { ...TYPE.displayTitle, fontSize: 18")) {
  fail("Home sectionTitle no debe usar Fraunces por debajo de 22");
}

const sem = read("src/components/SemaforoVeredicto.tsx");
if (!sem.includes("TYPE.displayVerdict") || !sem.includes("TYPE.caption")) {
  fail("Semaforo debe usar displayVerdict + caption (no texto 11px)");
}

const pkg = read("package.json");
if (!pkg.includes("assert_tipografia_accesible.mjs")) {
  fail("package.json debe incluir assert_tipografia_accesible.mjs");
}

if (fallos) {
  console.error(`assert_tipografia_accesible: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_tipografia_accesible");
