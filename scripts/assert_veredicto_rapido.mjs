/**
 * Assert: veredicto legal del punto en Tu salida (gesto → Más de hoy);
 * detalle de tramo plegado.
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
const card = fs.readFileSync(path.join(root, "src/components/ConsultaPescaCard.tsx"), "utf8");
const tarjeta = fs.readFileSync(path.join(root, "src/components/TarjetaPuntoHoy.tsx"), "utf8");

for (const needle of [
  "EJE_METEO",
  "abrirVeredictoRapido",
  "etiquetaHoy",
  "detalleTramo",
  "compacto",
  "expandido={detalleTramo}",
  "onToggleDetalle",
  "<TarjetaPuntoHoy",
  "onPuedo={abrirVeredictoRapido}",
]) {
  if (!home.includes(needle)) fail(`HomeScreen sin ${needle}`);
}
if (home.includes('eje="meteo"')) {
  fail("Home no debe mostrar «¿Cómo pinta el día?» (EjeLegalMeteo meteo)");
}
if (home.includes("EJE_LEGAL.tituloCorto")) {
  fail("Home hero no debe repetir EJE_LEGAL.tituloCorto (veredicto en TarjetaPuntoHoy)");
}

// Veredicto en tarjeta del punto, no como chip numerado del hero
if (!tarjeta.includes("EJE_LEGAL") || !tarjeta.includes("certeza.sello")) {
  fail("TarjetaPuntoHoy debe mostrar veredicto legal con certeza");
}
if (/orden="[0-9]"/.test(tarjeta) || /styles\.orden\b/.test(tarjeta)) {
  fail("TarjetaPuntoHoy no debe numerar filas (1·2·3)");
}

for (const needle of [
  "compacto = false",
  "expandido",
  "onToggleDetalle",
  "Ver detalle",
  "mostrarTodo",
  "compactoRow",
]) {
  if (!card.includes(needle)) fail(`ConsultaPescaCard sin ${needle}`);
}

const pkg = fs.readFileSync(path.join(root, "package.json"), "utf8");
if (!pkg.includes("assert_veredicto_rapido.mjs")) {
  fail("package.json assert debe incluir assert_veredicto_rapido.mjs");
}

if (fallos) {
  console.error(`assert_veredicto_rapido: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_veredicto_rapido");
