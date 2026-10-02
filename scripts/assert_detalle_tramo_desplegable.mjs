/**
 * Assert: «Más de hoy» en Hoy es un bloque desplegable (acordeón).
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

const iTitulo = home.indexOf("Más de hoy");
if (iTitulo < 0) fail("HomeScreen sin Más de hoy");

const bloque = home.slice(
  Math.max(0, home.indexOf("Más de hoy") - 200),
  home.indexOf("Más de hoy") + 2200
);
for (const n of [
  "accessibilityState={{ expanded: detalleTramo || antesAbierto }}",
  "Desplegar más de hoy",
  "bloqueCabecera",
  "bloqueSub",
  "toca para ver",
  "TemporadaBanner",
  "PanelAvisosSeguridad",
  "LicenseBanner",
  "modoPanelAbierto",
  "Cómo pescas",
]) {
  if (!home.includes(n)) fail(`Hoy sin ${n}`);
}

if (!home.includes("detalleTramo || antesAbierto")) {
  fail("Más de hoy debe condicionar el contenido al desplegable");
}
if (!bloque.includes("ConsultaPescaCard") && !home.includes("ConsultaPescaCard")) {
  fail("Más de hoy debe montar ConsultaPescaCard al desplegar");
}

const pkg = fs.readFileSync(path.join(root, "package.json"), "utf8");
if (!pkg.includes("assert_detalle_tramo_desplegable.mjs")) {
  fail("package.json assert debe incluir assert_detalle_tramo_desplegable.mjs");
}

if (fallos) {
  console.error(`assert_detalle_tramo_desplegable: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_detalle_tramo_desplegable");
