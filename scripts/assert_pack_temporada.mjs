/**
 * Assert: infraestructura de pack de temporada + fuentes normativas por provincia.
 * No demuestra que el BO esté al día (eso es el ritual humano/IA); sí que el
 * cableado existe y las notas de vigencia no están vacías.
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
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}
function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

for (const f of [
  ".github/PARA_TI_TEMPORADA.md",
  ".github/agents/PACK_TEMPORADA.md",
  ".github/ISSUE_TEMPLATE/pack-temporada.md",
  ".github/workflows/season-check.yml",
  ".github/workflows/ci-assert.yml",
  "scripts/season_briefing.mjs",
]) {
  if (!exists(f)) fail(`falta ${f}`);
}

const briefing = read("scripts/season_briefing.mjs");
for (const n of ["temporadaObjetivo", "--issue-body", "--github-out", "PACK_TEMPORADA"]) {
  if (!briefing.includes(n)) fail(`season_briefing sin ${n}`);
}

const seasonWf = read(".github/workflows/season-check.yml");
if (!seasonWf.includes("cron:") || !seasonWf.includes("pack-temporada")) {
  fail("season-check debe programar cron y usar label pack-temporada");
}
if (!seasonWf.includes("workflow_dispatch")) {
  fail("season-check debe poder lanzarse a mano (workflow_dispatch)");
}

const ci = read(".github/workflows/ci-assert.yml");
if (!ci.includes("npm run assert") || !ci.includes("pull_request")) {
  fail("ci-assert debe correr assert en pull_request");
}

const paraTi = read(".github/PARA_TI_TEMPORADA.md");
if (!paraTi.includes("Cloud Agent") || !paraTi.includes("Pull Request")) {
  fail("PARA_TI_TEMPORADA debe explicar el flujo no técnico");
}

const playbook = read(".github/agents/PACK_TEMPORADA.md");
for (const n of ["FUENTE_NORMATIVA", "sync:icv", "npm run assert", "Prohibido"]) {
  if (!playbook.includes(n)) fail(`playbook sin ${n}`);
}

/** Fuentes embebidas: no vacías y con URL http */
const fuentes = [
  ["src/data/normativa2026.ts", "FUENTE_NORMATIVA"],
  ["src/provincias/sevilla/normativa.ts", "FUENTE_NORMATIVA_ANDALUCIA"],
  ["src/provincias/cordoba/normativa.ts", "FUENTE_NORMATIVA_ANDALUCIA"],
  ["src/provincias/cuenca/normativa.ts", "FUENTE_NORMATIVA_CLM"],
];
for (const [rel, clave] of fuentes) {
  const t = read(rel);
  if (!t.includes(clave)) fail(`${rel} sin ${clave}`);
  if (!t.includes("vigenciaNota")) fail(`${rel} sin vigenciaNota`);
  if (!/https?:\/\//.test(t)) fail(`${rel} sin URL oficial`);
}

const pkg = read("package.json");
if (!pkg.includes("season:briefing") || !pkg.includes("assert_pack_temporada.mjs")) {
  fail("package.json debe cablear season:briefing y assert_pack_temporada");
}

if (fallos) {
  console.error(`assert_pack_temporada: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_pack_temporada");
