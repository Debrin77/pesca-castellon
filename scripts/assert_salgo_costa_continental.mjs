/**
 * Assert: Salgo a pescar en Castellón permite costa o continental,
 * abre el mapa en el modo pedido, y no se cuelga el spinner.
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

const salgo = read("src/screens/SalgoAPescarScreen.tsx");
for (const n of [
  "MedioSalida",
  "permiteCosta",
  "setMedio",
  "medio === \"maritimo\"",
  "Costa / orilla",
  "Ríos y embalses",
  "modoMapa",
  "ambito === \"maritimo\"",
  "aplicandoRef.current = false",
  "Playas fáciles para empezar",
]) {
  if (!salgo.includes(n)) fail(`SalgoAPescarScreen sin ${n}`);
}

const mapa = read("src/screens/ZonasLibresScreen.tsx");
for (const n of [
  "modoMapa?:",
  'p.modoMapa === "costa"',
  "modoMapa: undefined",
  "resolverPickUbicacion",
]) {
  if (!mapa.includes(n)) fail(`ZonasLibresScreen sin ${n}`);
}
// Ya no debe fijarPunto en usarUbicacionParaSalgo (doble await / cuelgue).
const idxSalgo = mapa.indexOf("async function usarUbicacionParaSalgo");
const idxFin = mapa.indexOf("\n  function confirmarPickSiProcede", idxSalgo);
const bloque = mapa.slice(idxSalgo, idxFin > 0 ? idxFin : idxSalgo + 800);
if (idxSalgo < 0) fail("usarUbicacionParaSalgo no encontrada");
else if (/\bfijarPunto\b/.test(bloque)) {
  fail("usarUbicacionParaSalgo no debe llamar fijarPunto (lo hace Salgo al consumir el pick)");
}
if (!bloque.includes("resolverPickUbicacion")) {
  fail("usarUbicacionParaSalgo debe resolver el pick hacia Salgo");
}

const idx = read("src/services/fishingIndexService.ts");
if (!idx.includes("AbortController") || !idx.includes("10_000")) {
  fail("calcularIndicePesca debe tener timeout (~10s) para no colgar Salgo");
}

const sitios = read("src/data/sitiosFaciles.ts");
if (!sitios.includes('ambito: "maritimo"') || !sitios.includes("grao_pinar")) {
  fail("sitiosFaciles Castellón debe incluir playas marítimas");
}

const pkg = read("package.json");
if (!pkg.includes("assert_salgo_costa_continental.mjs")) {
  fail("package.json assert debe incluir assert_salgo_costa_continental.mjs");
}

if (fallos) {
  console.error(`assert_salgo_costa_continental: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_salgo_costa_continental");
