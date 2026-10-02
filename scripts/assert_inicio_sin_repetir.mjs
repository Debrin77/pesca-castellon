/**
 * Assert: Inicio no repite el veredicto legal en el hero (vive en Tu salida / Más de hoy).
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
for (const n of [
  "ocultarVeredictoCompacto",
  "Más de hoy",
  "SiguientePasoCard",
  "TarjetaPuntoHoy",
  "abrirVeredictoRapido",
]) {
  if (!home.includes(n)) fail(`HomeScreen sin ${n}`);
}

// El hero no debe mostrar el chip de normativa ¿puedo? (duplicado)
if (home.includes("EJE_LEGAL.tituloCorto") || home.includes("veredictoRapidoKicker")) {
  fail("Hero no debe mostrar Normativa · ¿puedo? (va en Tu salida / Más de hoy)");
}
if (home.includes("Normativa del tramo")) {
  fail("Home no debe titular el bloque inferior «Normativa del tramo»");
}

const card = read("src/components/ConsultaPescaCard.tsx");
if (!card.includes("ocultarVeredictoCompacto")) {
  fail("ConsultaPescaCard debe soportar ocultarVeredictoCompacto");
}

const tarjeta = read("src/components/TarjetaPuntoHoy.tsx");
if (!tarjeta.includes("EJE_LEGAL") || !tarjeta.includes("onPuedo")) {
  fail("TarjetaPuntoHoy debe mostrar el veredicto legal (¿puedo?)");
}

const pkg = read("package.json");
if (!pkg.includes("assert_inicio_sin_repetir.mjs")) {
  fail("package.json assert debe incluir assert_inicio_sin_repetir.mjs");
}

if (fallos) {
  console.error(`assert_inicio_sin_repetir: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_inicio_sin_repetir");
