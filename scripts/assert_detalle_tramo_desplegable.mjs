/**
 * Assert: «Detalle y avisos» en Hoy es un bloque desplegable (acordeón).
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

const iTitulo = home.indexOf("Detalle y avisos");
if (iTitulo < 0) fail("HomeScreen sin Detalle y avisos");

const bloque = home.slice(
  home.indexOf("{/* Un solo desplegable"),
  home.indexOf("styles.guiaRow") > 0 ? home.indexOf("<View style={styles.guiaRow}") : home.length
);
for (const n of [
  "accessibilityState={{ expanded: detalleTramo || antesAbierto }}",
  "Desplegar detalle del punto y avisos",
  "bloqueCabecera",
  "bloqueSub",
  "toca para ver",
  "TemporadaBanner",
  "PanelAvisosSeguridad",
  "LicenseBanner",
]) {
  if (!bloque.includes(n) && !home.includes(n)) fail(`Detalle y avisos sin ${n}`);
}

if (!home.includes("detalleTramo || antesAbierto")) {
  fail("Detalle y avisos debe condicionar el contenido al desplegable");
}
if (!bloque.includes("ConsultaPescaCard") && !home.includes("ConsultaPescaCard")) {
  fail("Detalle y avisos debe montar ConsultaPescaCard al desplegar");
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
