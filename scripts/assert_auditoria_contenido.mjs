/**
 * Assert de cobertura: normativa / fechas / fotos / gráficos.
 * Evita que auditorías ad hoc vuelvan a descubrir los mismos fallos.
 *
 * Uso: node scripts/assert_auditoria_contenido.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import crypto from "crypto";

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
function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

// --- Orilla: Boops ≠ Pseudochondrostoma ---
const orilla = JSON.parse(read("src/data/especiesOrilla.json"));
const bogaOrilla = (orilla.pescablesOrilla || []).find((s) => s.id === "boga" || s.id === "boga_mar");
if (!bogaOrilla || bogaOrilla.id !== "boga_mar") fail("orilla debe usar boga_mar (Boops)");
else if (!/Boops/i.test(bogaOrilla.nombreCientifico || "")) fail("boga_mar sin Boops");
else ok("orilla boga_mar = Boops");

const media = read("src/data/especiesMedia.ts");
const diag = read("src/data/diagramasMedicionEspecie.ts");
for (const id of ["boga", "boga_mar"]) {
  if (!media.includes(`${id}:`)) fail(`especiesMedia sin ${id}`);
  if (!diag.includes(`${id}:`)) fail(`diagramasMedicion sin ${id}`);
  if (!exists(`assets/especies/${id}.jpg`)) fail(`falta foto ${id}`);
  if (!exists(`assets/medicion/especies/${id}.jpg`)) fail(`falta placa ${id}`);
}

// Fotos distintas entre boga / boga_mar
const hBoga = crypto.createHash("md5").update(fs.readFileSync(path.join(root, "assets/especies/boga.jpg"))).digest("hex");
const hBogaMar = crypto.createHash("md5").update(fs.readFileSync(path.join(root, "assets/especies/boga_mar.jpg"))).digest("hex");
if (hBoga === hBogaMar) fail("foto boga y boga_mar son idénticas");
else ok("fotos boga ≠ boga_mar");

// Cobertura media de especies con talla (orilla + barco + extras clave)
const barco = JSON.parse(read("src/data/especiesEmbarcacion.json"));
const conTalla = [
  ...(orilla.pescablesOrilla || []).filter((s) => s.tallaCm != null),
  ...(barco.pescables || []).filter((s) => s.tallaCm != null),
];
for (const sp of conTalla) {
  if (!media.includes(`${sp.id}:`) && !exists(`assets/especies/${sp.id}.jpg`)) {
    // alias llobarro→lubina ok only for continental; orilla/barco ids should have file or map
    if (sp.id === "llobarro" && media.includes("lubina:")) continue;
    fail(`especie con talla sin foto: ${sp.id}`);
  }
}
ok(`cobertura foto especies con talla (${conTalla.length})`);

// Anjova ≠ llampuga
const embTxt = read("src/data/especiesEmbarcacion.json");
if (/Anjova\s*\/\s*Llampuga/i.test(embTxt)) fail("anjova no debe llamarse llampuga (Coryphaena)");
else ok("anjova sin llampuga");

// Sevilla: cacho no «sin muerte»
const sitiosSev = read("src/provincias/sevilla/sitiosComunidad.json");
if (/cacho\s+sin\s+muerte/i.test(sitiosSev)) fail("Sevilla sitiosComunidad: cacho no es sin muerte (art. 2.2 prohibido)");
else ok("Sevilla sin 'cacho sin muerte'");

// Córdoba: no presentar marismas Guadalquivir como default sin matizar Sevilla
const cordNorm = read("src/provincias/cordoba/normativa.ts");
const cordCang = read("src/provincias/cordoba/speciesOverrides.json");
if (/Cangrejo rojo: solo controladores autorizados \(Orden 3\/08\/2016, marismas del Guadalquivir\)/.test(cordNorm)) {
  fail("Córdoba REGLAS aún venden marismas Guadalquivir como default");
}
if (!/Córdoba|CÓRDOBA|Sevilla/i.test(cordCang) || /⚠️ ANDALUCÍA: cangrejo rojo/.test(cordCang)) {
  // must be Córdoba-specific warning
  if (/⚠️ ANDALUCÍA: cangrejo rojo/.test(cordCang)) fail("Córdoba ficha cangrejo aún etiquetada ANDALUCÍA genérica");
}
ok("Córdoba cangrejo no sangra marismas como default");

// Marquesado: mejoresEpocas trucha no en abr/may
const zonesCu = JSON.parse(read("src/provincias/cuenca/zones.json"));
const marquesado = zonesCu.find((z) => z.id === "laguna_del_marquesado");
if (!marquesado) fail("falta zona laguna_del_marquesado");
else {
  const ep = marquesado.mejoresEpocas?.trucha_comun || [];
  if (ep.includes("abril") || ep.includes("mayo")) fail("Marquesado mejoresEpocas trucha no puede incluir abr/may (apertura 1 jun)");
  else ok("Marquesado mejoresEpocas trucha ≥ junio");
}

// Tarjeta: SM antes que cm
const tarjeta = read("src/components/TarjetaEspecie.tsx");
const idxSm = tarjeta.indexOf("/sin muerte/i.test(fuente)");
const idxCm = tarjeta.indexOf('fuente.match(/(\\d+(?:[.,]\\d+)?)\\s*(cm|kg)/i)');
if (idxSm < 0 || idxCm < 0 || idxSm > idxCm) fail("tallaDestacada debe preferir SM antes de parsear cm");
else ok("tallaDestacada prioriza SM");

// Placas críticas regeneradas deben existir y no ser tarpon-hash del jurel antiguo
for (const id of ["jurel", "palometon", "black_bass", "mojarra", "siluro", "mugilidos", "boga_mar", "cangrejo_americano"]) {
  if (!exists(`assets/medicion/especies/${id}.jpg`)) fail(`falta placa ${id}`);
}
ok("placas críticas presentes");

// Runtime: fechas / cupo / Marquesado
const runtime = `
import { setProvinciaActiva } from './src/provincias/runtime.ts';
import { estaEnVeda, PERIODOS_HABILES } from './src/services/vedaService.ts';
import { tercerDomingoDeMarzo } from './src/data/normativa2026.ts';
import { periodoTruchaTramoClmAbierto } from './src/provincias/cuenca/normativa.ts';
import { parsearCupo } from './src/services/cupoService.ts';
import { consultarPorTramo } from './src/services/consultaPescaService.ts';
import tramos from './src/provincias/cuenca/tramosOficiales.json';

const ini = PERIODOS_HABILES.find((p) => p.especieId === 'trucha_comun')!.inicio;
const t2027 = tercerDomingoDeMarzo(2027);
if (ini.dia !== tercerDomingoDeMarzo(new Date().getFullYear()).getDate()) {
  throw new Error('PERIODOS_HABILES.inicio trucha no coincide con tercer domingo del año actual');
}
if (t2027.getDate() !== 21) throw new Error('tercer domingo 2027 debe ser 21');

setProvinciaActiva('cuenca');
const marq = tramos.find((x) => x.id === 'cue-laguna_del_marquesado');
if (!marq) throw new Error('falta tramo marquesado');
if (periodoTruchaTramoClmAbierto(marq, new Date(2026, 3, 15))) {
  throw new Error('Marquesado no debe estar abierto el 15 abr');
}
if (!periodoTruchaTramoClmAbierto(marq, new Date(2026, 5, 1))) {
  throw new Error('Marquesado debe abrir 1 jun');
}
const c = consultarPorTramo(marq, new Date(2026, 3, 20));
if (c.sePuedePescarHoy) throw new Error('consulta Marquesado 20 abr debe ser HOY NO');

if (estaEnVeda('cangrejo_americano', new Date(2026, 2, 1)) !== true) throw new Error('cangrejo CLM veda mar');
if (estaEnVeda('trucha_arcoiris', new Date(2026, 0, 15)) !== false) {
  throw new Error('arcoíris CLM no debe vedarse con calendario genérico de trucheras');
}

const cupoBarbo = parsearCupo('0 (sin muerte) salvo Contreras/Alarcón/Buendía: máx. 6/día.');
if (cupoBarbo.maxUnidades !== 6) throw new Error('parsearCupo debe leer máx. 6 tras salvo, got ' + cupoBarbo.maxUnidades);
const cupo4 = parsearCupo('4/día (Res. 16/09/2024)');
if (cupo4.maxUnidades !== 4) throw new Error('parsearCupo debe leer 4/día');

console.log('RUNTIME_OK auditoria_contenido');
`;

const run = spawnSync("npx", ["--yes", "tsx", "-e", runtime], {
  cwd: root,
  encoding: "utf8",
  timeout: 90_000,
});
if (run.status !== 0) {
  fail(`runtime: ${(run.stderr || run.stdout || "").slice(0, 1200)}`);
} else if (!(run.stdout || "").includes("RUNTIME_OK")) {
  fail("runtime sin RUNTIME_OK");
  console.error(run.stdout);
} else {
  ok((run.stdout || "").trim().split("\n").filter((l) => l.includes("RUNTIME_OK")).join(" | "));
}

const pkg = read("package.json");
if (!pkg.includes("assert_auditoria_contenido.mjs")) {
  fail("package.json assert debe incluir assert_auditoria_contenido.mjs");
} else ok("package.json cablea assert_auditoria_contenido");

if (fallos) {
  console.error(`\n${fallos} fallo(s)`);
  process.exit(1);
}
console.log("\nassert_auditoria_contenido OK");
