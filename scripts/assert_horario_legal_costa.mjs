/**
 * Assert: aviso de franja horaria con orto/ocaso en costa y continental.
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

const weather = read("src/services/weatherService.ts");
for (const n of ["obtenerOrtoOcaso", "OrtoOcasoDia", "sunrise,sunset", "horaCortaDeIso", "isoConOffset"]) {
  if (!weather.includes(n)) fail(`weatherService sin ${n}`);
}

const svc = read("src/services/horarioLegalService.ts");
for (const n of [
  "construirAvisoHorario",
  "obtenerAvisoHorarioLegal",
  "sumarHoras",
  "maritimo",
  "continental",
  "HORARIO_LEGAL_ORILLA_MAR",
  "HORARIO_SUBMARINA_CV",
  "Hoy permitido (aprox.)",
  "Hoy luz solar",
]) {
  if (!svc.includes(n)) fail(`horarioLegalService sin ${n}`);
}

// Franja continental = orto−1h / ocaso+1h
if (!svc.includes("sumarHoras(orto, -1)") || !svc.includes("sumarHoras(ocaso, 1)")) {
  fail("horario continental debe ser orto-1h → ocaso+1h");
}

const norma = read("src/data/normativaMaritima.ts");
for (const n of [
  "HORARIO_LEGAL_ORILLA_MAR",
  "HORARIO_SUBMARINA_CV",
  "sin veda nocturna general",
  "ocaso→orto",
  "submarina",
]) {
  if (!norma.includes(n)) fail(`normativaMaritima sin ${n}`);
}

const aviso = read("src/components/AvisoHorarioLegal.tsx");
for (const n of ["obtenerAvisoHorarioLegal", "franjaTxt", "estadoTxt", "Calculando orto"]) {
  if (!aviso.includes(n)) fail(`AvisoHorarioLegal sin ${n}`);
}

const card = read("src/components/ConsultaPescaCard.tsx");
if (!card.includes("AvisoHorarioLegal")) fail("ConsultaPescaCard debe mostrar AvisoHorarioLegal");
if (!card.includes("latEfectiva")) fail("ConsultaPescaCard debe resolver coords del punto");

const salgo = read("src/screens/SalgoAPescarScreen.tsx");
if (!salgo.includes("AvisoHorarioLegal")) fail("SalgoAPescar debe mostrar AvisoHorarioLegal");
if (!salgo.includes("ambito={medio}")) fail("Salgo debe pasar medio como ambito del aviso");

const mejor = read("src/components/MejorHoraPesca.tsx");
if (!mejor.includes("HORARIO_LEGAL_ORILLA_MAR")) fail("MejorHoraPesca debe usar horario de orilla en costa");
if (!mejor.includes('ambito === "maritimo"')) fail("MejorHoraPesca debe ramificar por ambito");

const orilla = read("src/data/especiesOrilla.json");
if (orilla.includes("tú hasta 1 h después del ocaso")) {
  fail("especiesOrilla no debe aplicar el ±1 h continental a costa");
}
if (orilla.includes("recuerda que de noche no se pesca")) {
  fail("especiesOrilla no debe afirmar veda nocturna general de caña");
}
if (!orilla.includes("sin veda nocturna general")) {
  fail("especiesOrilla debe aclarar ausencia de veda nocturna general en caña");
}

const pkg = read("package.json");
if (!pkg.includes("assert_horario_legal_costa.mjs")) {
  fail("package.json assert debe incluir assert_horario_legal_costa.mjs");
}

// Pure math check: ±1 h around fixed orto/ocaso (UTC ms, independent of host TZ)
const orto = Date.parse("2026-06-21T06:30:00+02:00");
const ocaso = Date.parse("2026-06-21T21:30:00+02:00");
const inicio = orto - 3600000;
const fin = ocaso + 3600000;
if (inicio !== Date.parse("2026-06-21T05:30:00+02:00")) fail("orto-1h mal calculado");
if (fin !== Date.parse("2026-06-21T22:30:00+02:00")) fail("ocaso+1h mal calculado");
const dentro = Date.parse("2026-06-21T12:00:00+02:00");
const fuera = Date.parse("2026-06-21T23:30:00+02:00");
if (!(dentro >= inicio && dentro <= fin)) fail("mediodía debería estar dentro");
if (fuera >= inicio && fuera <= fin) fail("23:30 debería estar fuera");

if (fallos) {
  console.error(`assert_horario_legal_costa: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_horario_legal_costa");
