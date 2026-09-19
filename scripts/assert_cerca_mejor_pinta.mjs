/**
 * Assert: bloque «cerca con mejor pinta» tras consulta en mapa.
 * Plegable, top 3 por índice, no bloquea veredicto legal.
 * Debe funcionar en Castellón y provincias continentales dispersas.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

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
  "resolverTramoDeSitioFacil",
  "RADIO_KM",
]) {
  if (!util.includes(n)) fail(`cercaMejorPinta sin ${n}`);
  else ok(`util:${n}`);
}

// Radio amplio para provincias dispersas (no el antiguo 15 km fijo de río).
if (!/rio:\s*5[0-9]/.test(util)) fail("radio río debe ser ≥50 km para embalses aislados");
else ok("radio río amplio");

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

const utilLegal = read("src/utils/cercaMejorPinta.ts");
if (!utilLegal.includes("esPescableHoy")) fail("falta filtro esPescableHoy");
else ok("filtra no pescables");
if (!utilLegal.includes('"VP"')) fail("falta excluir VP vedado");
else ok("excluye VP");
if (!utilLegal.includes("reserva_trucha")) fail("falta excluir reserva_trucha");
else ok("excluye reserva");
if (!utilLegal.includes("pasaFiltroLegal")) fail("falta pasaFiltroLegal");
else ok("pasaFiltroLegal");

// El bloque va DESPUÉS de ConsultaPescaCard (veredicto primero).
const idxCard = mapa.indexOf("<ConsultaPescaCard");
const idxCerca = mapa.indexOf("<CercaMejorPintaBlock");
if (idxCard < 0 || idxCerca < 0 || idxCerca < idxCard) {
  fail("CercaMejorPintaBlock debe ir después de ConsultaPescaCard");
} else ok("orden: veredicto → cerca");

const pkg = read("package.json");
if (!pkg.includes("assert_cerca_mejor_pinta.mjs")) {
  fail("package.json assert debe incluir assert_cerca_mejor_pinta.mjs");
} else ok("package.json cablea assert");

// Runtime: pool no vacío en puntos típicos de cada provincia.
const runtime = `
import { setProvinciaActiva } from './src/provincias/runtime.ts';
import {
  listarCandidatosCercaSync,
  resolverTramoDeSitioFacil,
} from './src/utils/cercaMejorPinta.ts';
import { sitiosFacilesDe } from './src/data/sitiosFaciles.ts';

const casos = [
  { id: 'castellon', lat: 40.0105, lng: -0.2332, min: 1 }, // Sichar
  { id: 'sevilla', lat: 37.72475, lng: -6.12029, min: 1 }, // Cala
  { id: 'sevilla', lat: 37.03432, lng: -5.71923, min: 1 }, // Torre del Águila (aislada)
  { id: 'cordoba', lat: 37.24204, lng: -4.28606, min: 1 }, // Iznájar
  { id: 'cordoba', lat: 37.8765, lng: -4.7795, min: 1 }, // capital
  { id: 'cuenca', lat: 39.6555, lng: -2.208, min: 1 }, // Alarcón
  { id: 'cuenca', lat: 39.5854, lng: -1.5238, min: 1 }, // Contreras
];

for (const c of casos) {
  setProvinciaActiva(c.id);
  const pool = listarCandidatosCercaSync({ lat: c.lat, lng: c.lng, modo: 'rio' });
  if (pool.length < c.min) {
    throw new Error(c.id + ' @' + c.lat + ',' + c.lng + ' pool=' + pool.length);
  }
  console.log('POOL_OK', c.id, c.lat, pool.length, pool[0]?.nombre, pool[0]?.distanciaKm.toFixed(1)+'km');
}

// Sitio fácil Andalucía → tramo ZPL (no refugio VP).
setProvinciaActiva('cordoba');
const nav = sitiosFacilesDe('cordoba').find((s) => s.id === 'co-navallana');
if (!nav) throw new Error('falta sitio navallana');
const t = resolverTramoDeSitioFacil(nav);
if (!t) throw new Error('navallana sin tramo');
if (t.aprovechamiento === 'VP') throw new Error('navallana resolvió refugio VP: ' + t.id);
console.log('FACIL_OK', t.id, t.aprovechamiento);
`;

const run = spawnSync("npx", ["--yes", "tsx", "-e", runtime], {
  cwd: root,
  encoding: "utf8",
  timeout: 90_000,
});
if (run.status !== 0) {
  fail(`runtime multi-provincia: ${(run.stderr || run.stdout || "").slice(0, 800)}`);
} else if (!(run.stdout || "").includes("POOL_OK") || !(run.stdout || "").includes("FACIL_OK")) {
  fail("runtime sin POOL_OK/FACIL_OK");
  console.error(run.stdout);
} else {
  for (const line of (run.stdout || "").trim().split("\n")) {
    if (line.includes("POOL_OK") || line.includes("FACIL_OK")) ok(line);
  }
}

if (fallos) {
  console.error(`\n${fallos} fallo(s)`);
  process.exit(1);
}
console.log("\nassert_cerca_mejor_pinta OK");
