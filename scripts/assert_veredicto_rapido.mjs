/**
 * Assert: Inicio muestra veredicto del punto en el primer pantallazo
 * y el detalle de «Tu tramo» va plegado (gesto único → expandir).
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

for (const needle of [
  "veredictoRapido",
  "abrirVeredictoRapido",
  "etiquetaHoy",
  "colorSemaforo",
  "detalleTramo",
  "compacto",
  "expandido={detalleTramo}",
  "onToggleDetalle",
  "Veredicto del punto",
]) {
  if (!home.includes(needle)) fail(`HomeScreen sin ${needle}`);
}

// El chip del hero debe ir antes del CTA Salgo (respuesta sin scroll)
const iChip = home.indexOf("veredictoRapido");
const iSalgo = home.indexOf('ctaSalgoTitle');
if (iChip < 0 || iSalgo < 0 || !(iChip < iSalgo)) {
  fail("veredictoRapido debe aparecer en el hero antes del CTA Salgo a pescar");
}

for (const needle of [
  "compacto = false",
  "expandido",
  "onToggleDetalle",
  "Ver detalle",
  "mostrarTodo",
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
