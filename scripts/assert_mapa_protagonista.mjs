/**
 * Assert: mapa protagonista (alto fijo grande) + hora radar compacta (no come viewport).
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

const mapa = fs.readFileSync(path.join(root, "src/screens/ZonasLibresScreen.tsx"), "utf8");

for (const n of [
  "altoMapa",
  "Dimensions.get(\"window\").height",
  "h * 0.62",
  "Math.max(Math.round(h * 0.62), 440)",
  "height: altoMapa",
  "scrollMapa",
  "radarPlacaTxt",
  "RADIUS.pill",
]) {
  if (!mapa.includes(n)) fail(`ZonasLibresScreen sin ${n}`);
}

// La placa ya no debe ser el bloque enorme de 28px
if (mapa.includes("fontSize: 28")) {
  fail("Placa radar no debe usar tipografía enorme (28) que tapa el mapa");
}
if (mapa.includes("radarBannerDetalle")) {
  fail("Banner radar no debe repetir una tercera línea (radarBannerDetalle)");
}
if (mapa.includes("minHeight: 220")) {
  fail("mapWrap no debe quedarse en minHeight 220 (mapa pequeño)");
}

const pkg = fs.readFileSync(path.join(root, "package.json"), "utf8");
if (!pkg.includes("assert_mapa_protagonista.mjs")) {
  fail("package.json assert debe incluir assert_mapa_protagonista.mjs");
}

if (fallos) {
  console.error(`assert_mapa_protagonista: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_mapa_protagonista");
