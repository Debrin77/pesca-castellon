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

// Sevilla checklist no debe sangrar Iznájar (Córdoba Anexo V.2)
const sevNorm = read("src/provincias/sevilla/normativa.ts");
if (/Izn[aá]jar/i.test(sevNorm)) fail("Sevilla normativa no debe mencionar Iznájar (es Córdoba)");
else ok("Sevilla checklist sin Iznájar");

// Cordobilla / Malpasillo = Genil (no Corbones por Aguilar↔águila)
const sevTramos = JSON.parse(read("src/provincias/sevilla/tramosOficiales.json"));
const cordobilla = sevTramos.find((t) => t.id === "sev-refugio_embalse_de_cordobilla");
const malpasillo = sevTramos.find((t) => t.id === "sev-refugio_embalse_de_malpasillo");
if (!cordobilla || cordobilla.cuenca !== "Genil") fail("Cordobilla Sevilla debe ser cuenca Genil");
else ok("Cordobilla Sevilla = Genil");
if (!malpasillo || malpasillo.cuenca !== "Genil") fail("Malpasillo Sevilla debe ser cuenca Genil");
else ok("Malpasillo Sevilla = Genil");
const builderSev = read("scripts/build_sevilla_pesca_geojson.mjs");
if (!/cordobilla\|malpasillo\|genil/.test(builderSev)) fail("builder Sevilla debe mapear Cordobilla/Malpasillo a Genil");
if (/\/torre\|[aá]guila\|aguila\|santiago/.test(builderSev)) fail("builder Sevilla no debe usar /aguila/ sin word-boundary (rompe Aguilar→Genil)");
else ok("builder Sevilla evita Aguilar→Corbones");

// Placas regeneradas: herrera sin mancha caudal; oblada con mancha; tenca placa técnica (no placeholder)
for (const id of ["herrera", "oblada", "tenca"]) {
  if (!exists(`assets/medicion/especies/${id}.jpg`)) fail(`falta placa ${id}`);
}
{
  const tencaBytes = fs.statSync(path.join(root, "assets/medicion/especies/tenca.jpg")).size;
  if (tencaBytes < 80000) fail(`tenca.jpg placeholder (${tencaBytes} B); regenerar placa técnica`);
}
ok("placas herrera/oblada/tenca presentes");

// Carpín Castellón alineado con foto gibelio
const spCs = JSON.parse(read("src/data/species.json"));
const carpin = spCs.find((s) => s.id === "carpin");
if (!carpin || !/gibelio/i.test(carpin.nombreCientifico || "")) fail("carpin Castellón debe ser Carassius gibelio");
else ok("carpin = Carassius gibelio");

// Runtime: fechas / cupo / Marquesado / ZPC CLM / Iznájar / régimen especial / Buendía subtramo
const runtime = `
import { setProvinciaActiva } from './src/provincias/runtime.ts';
import { estaEnVeda, PERIODOS_HABILES } from './src/services/vedaService.ts';
import { tercerDomingoDeMarzo } from './src/data/normativa2026.ts';
import {
  periodoTruchaTramoClmAbierto,
  periodoTruchaAltaMontana,
  esRegimenEspecialCiprinidosClm,
  EMBALSES_BARBO_CON_CUPO_CUENCA,
  EMBALSES_BARBO_CUPO_SOLO_SUBTRAMO_CUENCA,
} from './src/provincias/cuenca/normativa.ts';
import { parsearCupo, cupoBarboCuencaParaFicha, esCupoBarboSoloSubtramoCuenca } from './src/services/cupoService.ts';
import { consultarPorTramo } from './src/services/consultaPescaService.ts';
import { construirAvisoHorario, esHorarioIznajarAnexoV2, esHorarioCangrejoClm } from './src/services/horarioLegalService.ts';
import tramos from './src/provincias/cuenca/tramosOficiales.json';
import tramosCs from './src/data/tramosOficiales.json';
import { REGLAS_GENERALES_CLM } from './src/provincias/cuenca/normativa.ts';

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
// Cierre alta montaña 15 oct (no 30 sep de baja)
if (!periodoTruchaTramoClmAbierto(marq, new Date(2026, 9, 10))) {
  throw new Error('Marquesado debe seguir abierto el 10 oct (alta montaña)');
}
if (periodoTruchaTramoClmAbierto(marq, new Date(2026, 9, 16))) {
  throw new Error('Marquesado debe cerrar tras 15 oct');
}
const c = consultarPorTramo(marq, new Date(2026, 3, 20));
if (c.sePuedePescarHoy) throw new Error('consulta Marquesado 20 abr debe ser HOY NO');

// Régimen especial ciprínidos: fuera de temporada de trucha el punto NO cierra
const valde = tramos.find((x) => x.id === 'cue-rio_jucar_valdecabras');
const crist = tramos.find((x) => x.id === 'cue-rio_cabriel_cristinas');
if (!valde || !esRegimenEspecialCiprinidosClm(valde)) throw new Error('Valdecabras debe ser régimen especial');
if (!crist || !esRegimenEspecialCiprinidosClm(crist)) throw new Error('Cristinas debe ser régimen especial');
const cVal = consultarPorTramo(valde, new Date(2026, 9, 5)); // 5 oct fuera baja/alta trucha
if (!cVal.sePuedePescarHoy) throw new Error('Valdecabras régimen especial 5 oct debe permitir pesca (ciprínidos)');
const cCri = consultarPorTramo(crist, new Date(2026, 9, 5));
if (!cCri.sePuedePescarHoy) throw new Error('Cristinas régimen especial 5 oct debe permitir pesca');

// Alta montaña helper debe usarse (Marquesado 10 oct)
if (!periodoTruchaAltaMontana(new Date(2026, 9, 10))) throw new Error('alta montaña 10 oct abierta');
if (periodoTruchaAltaMontana(new Date(2026, 3, 15))) throw new Error('alta montaña 15 abr cerrada');

if (estaEnVeda('cangrejo_americano', new Date(2026, 2, 1)) !== true) throw new Error('cangrejo CLM veda mar');
if (estaEnVeda('trucha_arcoiris', new Date(2026, 0, 15)) !== false) {
  throw new Error('arcoíris CLM no debe vedarse con calendario genérico de trucheras');
}

const cupoBarbo = parsearCupo('0 (sin muerte) salvo Contreras/Alarcón/Buendía: máx. 6/día.');
if (cupoBarbo.maxUnidades !== null) {
  throw new Error('parsearCupo no debe inventar cupo 6 global si el régimen base es sin muerte (+salvo sitio)');
}
// Buendía: subtramo → no cupo numérico 6 en ficha del vaso entero
if (cupoBarboCuencaParaFicha('embalse_de_buendia') !== null) {
  throw new Error('Buendía vaso entero no debe exponer cupo 6 (solo subtramo cartel)');
}
if (!esCupoBarboSoloSubtramoCuenca('embalse_de_buendia')) throw new Error('Buendía debe marcarse subtramo');
if (cupoBarboCuencaParaFicha('embalse_de_alarcon') !== 6) throw new Error('Alarcón cupo 6');
if (cupoBarboCuencaParaFicha('embalse_de_contreras') !== 6) throw new Error('Contreras cupo 6');
if (EMBALSES_BARBO_CON_CUPO_CUENCA.has('embalse_de_buendia')) {
  throw new Error('Buendía no debe estar en EMBALSES_BARBO_CON_CUPO_CUENCA');
}
if (!EMBALSES_BARBO_CUPO_SOLO_SUBTRAMO_CUENCA.has('embalse_de_buendia')) {
  throw new Error('Buendía debe estar en set de solo-subtramo');
}
if (cupoBarboCuencaParaFicha('embalse_de_entrepenas') !== null) throw new Error('otras masas: sin cupo barbo');
const cupo4 = parsearCupo('4/día (Res. 16/09/2024)');
if (cupo4.maxUnidades !== 4) throw new Error('parsearCupo debe leer 4/día');

const buendia = tramos.find((x) => x.fichaId === 'embalse_de_buendia');
if (buendia) {
  const cb = consultarPorTramo(buendia, new Date(2026, 5, 15));
  const blob = [...cb.restriccionesHoy, ...cb.permisos].join(' ');
  if (!/presa|Alcocer|subtramo/i.test(blob)) {
    throw new Error('consulta Buendía debe avisar subtramo presa→Alcocer: ' + blob.slice(0, 220));
  }
}

// REGLAS no deben afirmar que Alto Tajo está cableado si no hay tramo
if (/Alto Tajo[\s\S]{0,80}La app aplica estos calendarios/i.test(REGLAS_GENERALES_CLM.join(' '))) {
  throw new Error('REGLAS CLM no deben afirmar soporte runtime de Alto Tajo sin tramo en catálogo');
}
if (!/no hay tramo separado|confirma visor/i.test(REGLAS_GENERALES_CLM.join(' '))) {
  throw new Error('REGLAS CLM deben matizar Alto Tajo / visor');
}

const cotoClm = tramos.find((x) => x.aprovechamiento === 'ZPC');
if (cotoClm) {
  const cc = consultarPorTramo(cotoClm, new Date(2026, 5, 15));
  const blob = [...cc.restriccionesHoy, ...cc.permisos].join(' ');
  if (/Hermanos Bou|Orden 30\\/2016|Castellón \\/ Segorbe/i.test(blob)) {
    throw new Error('ZPC CLM no debe sangrar PTOP/oficina GVA: ' + blob.slice(0, 200));
  }
  if (!/JCCM|venta en línea|CLM/i.test(blob)) {
    throw new Error('ZPC CLM debe mencionar JCCM/venta en línea');
  }
}

if (!esHorarioIznajarAnexoV2({ id: 'cor-embalse_de_iznajar', notaAnexo: 'ANEXO_V_2' })) {
  throw new Error('debe detectar Iznájar Anexo V.2');
}
if (!esHorarioCangrejoClm({ provinciaId: 'cuenca', especieId: 'cangrejo_americano' })) {
  throw new Error('debe detectar horario cangrejo CLM');
}
if (esHorarioCangrejoClm({ provinciaId: 'sevilla', especieId: 'cangrejo_americano' })) {
  throw new Error('cangrejo +2 h es excepción CLM, no Andalucía');
}
const fakeOrto = {
  ortoIso: '2026-09-27T07:00:00+02:00',
  ocasoIso: '2026-09-27T19:00:00+02:00',
  ortoTxt: '07:00',
  ocasoTxt: '19:00',
};
const hGen = construirAvisoHorario({
  ambito: 'continental',
  ortoOcaso: fakeOrto,
  ahora: new Date('2026-09-27T06:30:00+02:00'),
  provinciaId: 'cordoba',
  margenHoras: 1,
});
const hIzn = construirAvisoHorario({
  ambito: 'continental',
  ortoOcaso: fakeOrto,
  ahora: new Date('2026-09-27T06:30:00+02:00'),
  provinciaId: 'cordoba',
  margenHoras: 0,
  normaOverride: 'Iznájar Anexo V.2',
});
if (hGen.estado !== 'dentro') throw new Error('con ±1 h, 06:30 debe estar dentro');
if (hIzn.estado !== 'fuera') throw new Error('Iznájar sin ±1 h, 06:30 debe estar fuera');
const hCang = construirAvisoHorario({
  ambito: 'continental',
  ortoOcaso: fakeOrto,
  ahora: new Date('2026-09-27T20:30:00+02:00'),
  provinciaId: 'cuenca',
  margenHoras: 1,
  margenFinHoras: 2,
});
const hGenNoche = construirAvisoHorario({
  ambito: 'continental',
  ortoOcaso: fakeOrto,
  ahora: new Date('2026-09-27T20:30:00+02:00'),
  provinciaId: 'cuenca',
  margenHoras: 1,
});
if (hCang.estado !== 'dentro') throw new Error('cangrejo ocaso+2: 20:30 debe estar dentro');
if (hGenNoche.estado !== 'fuera') throw new Error('genérico ocaso+1: 20:30 debe estar fuera');

const al15 = tramosCs.find((t) => t.id === 'al15.zpc');
const conAnguila = tramosCs.filter((t) => (t.especies || []).includes('anguila'));
if (conAnguila.length) throw new Error('tramos CS no deben listar anguila recreativa: ' + conAnguila.map(t=>t.id).join(','));

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
