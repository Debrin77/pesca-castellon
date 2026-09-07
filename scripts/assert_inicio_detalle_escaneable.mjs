/**
 * Assert: detalle del tramo escaneable (3 puntos + normativa completa)
 * y barra de tabs más discreta (sin fila «Menú» fija).
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

const card = fs.readFileSync(path.join(root, "src/components/ConsultaPescaCard.tsx"), "utf8");
for (const n of [
  "puntosClave",
  "normativaCompleta",
  "Lo esencial hoy",
  "Ver normativa completa",
  "ocultarVeredictoCompacto",
]) {
  if (!card.includes(n)) fail(`ConsultaPescaCard sin ${n}`);
}
if (!card.includes(".slice(0, 3)")) {
  fail("ConsultaPescaCard debe limitar puntos clave a 3");
}

const tabs = fs.readFileSync(path.join(root, "src/components/BarraTabsScroll.tsx"), "utf8");
if (!tabs.includes("ANCHO_ITEM = 78")) fail("BarraTabsScroll debe mantener ANCHO_ITEM = 78");
if (!tabs.includes("needsScroll ? (")) {
  fail("BarraTabsScroll debe mostrar la fila de flechas solo si needsScroll");
}
if (tabs.includes('"Menú"') || tabs.includes("'Menú'")) {
  fail("BarraTabsScroll no debe mostrar hint fijo «Menú» (compite con el contenido)");
}
if (!tabs.includes("size={26}")) {
  fail("BarraTabsScroll debería usar iconos más compactos (size 26)");
}

const pkg = fs.readFileSync(path.join(root, "package.json"), "utf8");
if (!pkg.includes("assert_inicio_detalle_escaneable.mjs")) {
  fail("package.json assert debe incluir assert_inicio_detalle_escaneable.mjs");
}

if (fallos) {
  console.error(`assert_inicio_detalle_escaneable: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_inicio_detalle_escaneable");
