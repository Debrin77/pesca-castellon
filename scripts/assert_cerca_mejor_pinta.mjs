/**
 * Assert: bloque «cerca con mejor pinta» tras consulta en mapa.
 * Plegable, top 3 por índice, no bloquea veredicto legal.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let fallos = 0;
function fail(msg) {
  console.error("FAIL", msg);
  fallos++;
}
function ok(msg) {
  console.log("OK", msg);
}
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

for (const f of [
  "src/utils/cercaMejorPinta.ts",
  "src/components/CercaMejorPintaBlock.tsx",
]) {
  if (!fs.existsSync(path.join(root, f))) fail(`falta ${f}`);
  else ok(f);
}

const util = read("src/utils/cercaMejorPinta.ts");
for (const n of [
  "listarCandidatosCercaSync",
  "rankearCercaMejorPinta",
  "calcularIndicePesca",
  "calcularIndiceBarco",
  "formatearDistanciaKm",
  "TOP_N",
]) {
  if (!util.includes(n)) fail(`cercaMejorPinta sin ${n}`);
  else ok(`util:${n}`);
}

const ui = read("src/components/CercaMejorPintaBlock.tsx");
for (const n of [
  "rankearCercaMejorPinta",
  "cerca con mejor pinta",
  "accessibilityState",
  "expanded",
  "onAbrir",
]) {
  if (!ui.includes(n)) fail(`CercaMejorPintaBlock sin ${n}`);
  else ok(`ui:${n}`);
}
if (ui.includes("ActivityIndicator")) fail("no debe mostrar spinner que ocupe el sheet");

const mapa = read("src/screens/ZonasLibresScreen.tsx");
if (!mapa.includes("CercaMejorPintaBlock")) fail("mapa sin CercaMejorPintaBlock");
else ok("mapa integra bloque");
if (!mapa.includes("onAbrir={(fila) => evaluarPunto")) fail("mapa sin onAbrir→evaluarPunto");
else ok("abrir fila reaplica consulta");

// El bloque va DESPUÉS de ConsultaPescaCard (veredicto primero).
const idxCard = mapa.indexOf("<ConsultaPescaCard");
const idxCerca = mapa.indexOf("<CercaMejorPintaBlock");
if (idxCard < 0 || idxCerca < 0 || idxCerca < idxCard) {
  fail("CercaMejorPintaBlock debe ir después de ConsultaPescaCard");
} else ok("orden: veredicto → cerca");

if (fallos) {
  console.error(`\n${fallos} fallo(s)`);
  process.exit(1);
}
console.log("\nassert_cerca_mejor_pinta OK");
