/**
 * Assert: primer arranque fácil — sin doble cátedra ni permisos al entrar.
 * Completo: guía, GPS y notificaciones siguen disponibles bajo gesto.
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

const home = read("src/screens/HomeScreen.tsx");
if (home.includes('navigation.navigate("PrimeraSalida")') && /primeraSalidaHecha\(\)[\s\S]{0,200}navigate\("PrimeraSalida"\)/.test(home)) {
  // Auto-navigate on mount is the anti-pattern; invite via CTA is OK.
  const auto =
    /primeraSalidaHecha\(\)\.then\(\(hecha\) => \{[\s\S]*?if\s*\(\s*!hecha\s*\)\s*navigation\.navigate\("PrimeraSalida"\)/;
  if (auto.test(home)) {
    fail("Home no debe forzar navigate(PrimeraSalida) al montar");
  }
}
if (!home.includes("invitarPrimeraSalida") || !home.includes('tipo === "primera_salida"')) {
  fail("Home debe invitar a PrimeraSalida desde SiguientePaso (gesto), no forzarla");
}
if (!home.includes("usarMiUbicacion") || !home.includes("Usar mi ubicación")) {
  fail("Home debe ofrecer GPS bajo gesto «Usar mi ubicación»");
}
if (!home.includes("activarAlertasBuenDia") || !home.includes("solicitarPermisoNotificaciones")) {
  fail("Notificaciones deben quedar en gesto explícito (activarAlertasBuenDia)");
}
// No pedir GPS en el bootstrap de clima
const cargarBlock = home.slice(home.indexOf("async function cargar"), home.indexOf("async function pedirGpsConSheet"));
if (cargarBlock.includes("pedirGpsConSheet()")) {
  fail("cargar() no debe llamar pedirGpsConSheet (GPS diferido)");
}

const sel = read("src/screens/SelectorProvinciaScreen.tsx");
for (const n of ["Más detalles técnicos", "tecnico", "Costa", "Ríos"]) {
  if (!sel.includes(n)) fail(`SelectorProvincia sin ${n}`);
}
if (sel.includes("Polígonos ICV, cotos") || sel.includes("DERA / art. 5.2")) {
  fail("Selector no debe poner jerga ICV/DERA en el copy principal de puerta");
}

const paso = read("src/components/SiguientePasoCard.tsx");
if (!paso.includes('"guia"') || !paso.includes("primera_salida") || !paso.includes("Tu primera salida")) {
  fail("SiguientePasoCard debe tener modo guía / primera_salida");
}

const pkg = read("package.json");
if (!pkg.includes("assert_ftue_facil.mjs")) {
  fail("package.json assert debe incluir assert_ftue_facil.mjs");
}

if (fallos) {
  console.error(`assert_ftue_facil: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_ftue_facil");
