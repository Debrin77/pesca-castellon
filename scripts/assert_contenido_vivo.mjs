/**
 * Sync OTA de normativa / especies / zonas + prefetch SAIH en «Actualizando…».
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function fail(msg) {
  console.error("FAIL:", msg);
  process.exit(1);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

execSync("node scripts/build_contenido_vivo.mjs", { cwd: root, stdio: "inherit" });

if (!exists("public/content/manifest.json")) fail("falta public/content/manifest.json");
if (!exists("public/content/pack.json")) fail("falta public/content/pack.json");

const manifest = JSON.parse(read("public/content/manifest.json"));
if (!manifest.version || !manifest.pack) fail("manifest sin version/pack");

const pack = JSON.parse(read("public/content/pack.json"));
if (pack.schema !== 1) fail("pack.schema debe ser 1");
if (!pack.provincias?.castellon?.species?.length) fail("pack castellon.species vacío");
if (!pack.provincias?.castellon?.zones?.length) fail("pack castellon.zones vacío");
if (!pack.provincias?.sevilla?.zones?.length) fail("pack sevilla.zones vacío");
if (!pack.costa?.especiesOrilla?.pescablesOrilla?.length) fail("pack costa orilla vacío");
if (!pack.provincias?.castellon?.fuenteNormativa?.titulo) fail("pack sin fuenteNormativa");

const svc = read("src/services/contenidoVivoService.ts");
for (const needle of [
  "sincronizarContenidoVivo",
  "hidratarContenidoVivo",
  "provinciaConContenidoVivo",
  "manifest.json",
  "debrin77.github.io/pesca-castellon/content",
]) {
  if (!svc.includes(needle)) fail(`contenidoVivoService sin ${needle}`);
}

const home = read("src/screens/HomeScreen.tsx");
for (const needle of [
  "sincronizarContenidoVivo",
  "prefetchSaihInicio",
  "hidratarContenidoVivo",
  "normativa, especies, zonas, SAIH",
]) {
  if (!home.includes(needle)) fail(`HomeScreen sin ${needle}`);
}

const cat = read("src/services/catalogoEspeciesService.ts");
if (!cat.includes("catalogoCostaVivo") || !cat.includes("orillaActiva")) {
  fail("catalogoEspeciesService debe leer overlay costa");
}

const ctx = read("src/context/ProvinciaContext.tsx");
if (!ctx.includes("suscribirContenidoVivo") || !ctx.includes("provinciaConContenidoVivo")) {
  fail("ProvinciaContext debe reaccionar al pack OTA");
}

const runtime = read("src/provincias/runtime.ts");
if (!runtime.includes("provinciaConContenidoVivo")) {
  fail("runtime getProvinciaActiva debe aplicar overlay");
}

const pkg = read("package.json");
if (!pkg.includes("build_contenido_vivo.mjs")) fail("package.json sin build_contenido_vivo");
if (!pkg.includes("assert_contenido_vivo.mjs")) fail("package.json sin assert_contenido_vivo");

const inicioAssert = read("scripts/assert_inicio_carga_rapida.mjs");
if (!inicioAssert.includes("sincronizarContenidoVivo")) {
  fail("assert_inicio_carga_rapida debe exigir sync de contenido");
}

console.log("OK: contenido vivo (pack OTA + sync en Actualizando + SAIH prefetch)");
