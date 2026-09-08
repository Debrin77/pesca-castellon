/**
 * Assert: «Detalle del tramo» en Inicio es un bloque desplegable (acordeón).
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

const iTitulo = home.indexOf("Detalle del tramo");
if (iTitulo < 0) fail("HomeScreen sin Detalle del tramo");

// Cabecera tappable con estado expanded
const bloque = home.slice(
  home.indexOf("{/* Detalle del tramo"),
  home.indexOf("<ListaAnimada index={2}>")
);
for (const n of [
  "toggleDetalleTramo",
  "accessibilityState={{ expanded: detalleTramo }}",
  "Desplegar detalle del tramo",
  "bloqueCabecera",
  "bloqueSub",
  "toca para ver",
  "detalleTramo ? \"▲\" : \"▼\"",
  "detalleTramo ? (",
]) {
  if (!bloque.includes(n) && !home.includes(n)) fail(`Detalle del tramo sin ${n}`);
}

// El card solo se monta al desplegar (no queda siempre el compacto a la vista)
if (!bloque.includes("detalleTramo ? (")) {
  fail("Detalle del tramo debe condicionar el contenido a detalleTramo");
}
if (!bloque.includes("expandido={detalleTramo}")) {
  fail("ConsultaPescaCard debe seguir ligado a detalleTramo");
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
