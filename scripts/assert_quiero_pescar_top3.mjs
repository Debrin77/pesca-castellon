/**
 * Assert: flujo «Quiero pescar…» — modalidad (si hay costa) → especie → top 3.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let fallos = 0;
function fail(m) {
  console.error("FAIL", m);
  fallos++;
}
function read(r) {
  return fs.readFileSync(path.join(root, r), "utf8");
}

const bloque = read("src/components/QuieroPescarBlock.tsx");
for (const n of [
  "Quiero pescar",
  "¿Cómo vas a pescar?",
  "¿Qué quieres pescar?",
  "elegirTopSitiosPorEspecie",
  "especiesOrillaParaSeleccion",
  "especiesEmbarcacionUsuales",
  "disponibles.length > 1",
  "Sitios hoy",
  "onAbrirSitio",
  "modosRow",
  "StyleSheet.create",
]) {
  if (!bloque.includes(n)) fail(`QuieroPescarBlock sin ${n}`);
}

const home = read("src/screens/HomeScreen.tsx");
if (!home.includes("QuieroPescarBlock")) fail("HomeScreen sin QuieroPescarBlock");
if (!home.includes("onAbrirSitio=")) fail("Home debe cablear onAbrirSitio de QuieroPescar");

const top = read("src/components/TopSitiosEspecie.tsx");
for (const n of ["modosPregunta", "¿Desde orilla o en barco?", "onModoElegido"]) {
  if (!top.includes(n)) fail(`TopSitiosEspecie sin ${n}`);
}

const esp = read("src/screens/EspeciesScreen.tsx");
if (!esp.includes("modosPregunta=")) fail("EspeciesScreen debe pasar modosPregunta en costa");
if (!esp.includes("onModoElegido=")) fail("EspeciesScreen debe sincronizar modo al elegir orilla/barco");

const pkg = read("package.json");
if (!pkg.includes("assert_quiero_pescar_top3.mjs")) {
  fail("package.json assert debe incluir assert_quiero_pescar_top3.mjs");
}

if (fallos) {
  console.error(`assert_quiero_pescar_top3: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_quiero_pescar_top3");
