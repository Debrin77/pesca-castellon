/**
 * Assert: Inicio no repite el veredicto HOY SÍ/NO en hero + tarjeta compacta.
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
  "Detalle del tramo",
  "SiguientePasoCard",
  "veredictoRapido",
]) {
  if (!home.includes(n)) fail(`HomeScreen sin ${n}`);
}

if (home.includes("Normativa del tramo")) {
  fail("Home no debe titular el bloque inferior «Normativa del tramo» (ya está en el hero)");
}

const idx = home.indexOf("consultaViva && hoyEtiqueta");
const idx2 = home.indexOf("veredictoRapidoVacio");
if (idx > 0 && idx2 > idx) {
  const heroChip = home.slice(idx, idx2);
  if (heroChip.includes("EJE_LEGAL.aviso") || heroChip.includes("styles.veredictoRapidoAviso")) {
    fail("Hero con consulta no debe repetir EJE_LEGAL.aviso");
  }
}

const card = read("src/components/ConsultaPescaCard.tsx");
if (!card.includes("ocultarVeredictoCompacto")) {
  fail("ConsultaPescaCard debe soportar ocultarVeredictoCompacto");
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
