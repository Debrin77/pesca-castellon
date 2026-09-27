/**
 * Assert: documentación kayak clara por provincia (embalse + mar Castellón).
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

const doc = read("src/data/documentacionKayak.ts");
for (const id of ["castellon", "sevilla", "cordoba", "cuenca"]) {
  if (!doc.includes(`provinciaId: "${id}"`)) fail(`falta bloque documentación kayak ${id}`);
}
if (!doc.includes("DESDE TIERRA")) fail("Castellón kayak mar debe citar licencia DESDE TIERRA");
if (!doc.includes("DESDE EMBARCACIÓN") && !doc.includes("DESDE EMBARCACION")) {
  fail("Castellón barco debe citar licencia DESDE EMBARCACIÓN");
}
if (!doc.includes("artefacto flotante")) fail("debe aclarar kayak = artefacto flotante");
if (!doc.includes("≥ 2,5 m") && !doc.includes(">= 2,5 m") && !doc.includes("2,5 m")) {
  fail("CHJ debe citar umbral de eslora 2,5 m");
}
if (!doc.includes("mar: null")) fail("AND/CLM deben marcar mar: null");
ok("documentacionKayak.ts cobertura provincias");

const license = read("src/data/license.ts");
if (/No vale sola la licencia «desde tierra»/.test(license)) {
  fail("license.ts no debe decir que desde tierra no vale para kayak");
}
if (!/artefacto flotante/i.test(license)) fail("license.ts debe citar artefacto flotante para kayak");
ok("license.ts kayak ≠ barco");

const norma = read("src/data/normativaMaritima.ts");
if (!norma.includes("DESDE TIERRA (GVA)")) fail("REGLAS/CHECKLIST deben citar kayak DESDE TIERRA");
if (!norma.includes("DESDE EMBARCACIÓN")) fail("REGLAS/CHECKLIST deben citar barco DESDE EMBARCACIÓN");
if (/Licencia de embarcación \/ kayak en regla \(no solo/.test(norma)) {
  fail("checklist no debe mezclar kayak con licencia de embarcación");
}
ok("normativaMaritima distingue kayak/barco");

const nav = read("src/data/navegacionKayakEmbalses.ts");
if (!nav.includes("2,5 m") || !nav.includes("1,5 m")) {
  fail("DOC_NAV_CHJ debe citar umbrales 2,5 m / 1,5 m mejillón cebra");
}
ok("DOC_NAV_CHJ umbrales eslora");

const screen = read("src/screens/LicenseScreen.tsx");
if (!screen.includes("documentacionKayakDeProvincia") || !screen.includes("Kayak · documentación")) {
  fail("LicenseScreen debe mostrar documentación kayak por provincia");
}
ok("LicenseScreen cablea documentación kayak");

const panel = read("src/components/PanelKayakEmbalse.tsx");
if (!panel.includes("Qué documentación pedir")) {
  fail("PanelKayakEmbalse debe titular la sección de documentación");
}
ok("PanelKayakEmbalse documentación explícita");

const runtime = `
import { documentacionKayakDeProvincia } from './src/data/documentacionKayak.ts';
import { REGLAS_EMBARCACION_MAR, CHECKLIST_EMBARCACION } from './src/data/normativaMaritima.ts';

const cs = documentacionKayakDeProvincia('castellon');
if (!cs?.mar) throw new Error('Castellón debe tener bloque mar');
if (!cs.mar.kayak.some((t) => /DESDE TIERRA/i.test(t))) throw new Error('kayak mar CS: DESDE TIERRA');
if (!cs.mar.barcoMatriculado.some((t) => /DESDE EMBARCACI[OÓ]N/i.test(t))) {
  throw new Error('barco CS: DESDE EMBARCACIÓN');
}
if (!cs.embalse.navegacion.some((t) => /2,5/.test(t))) throw new Error('CHJ eslora 2,5');

for (const id of ['sevilla', 'cordoba', 'cuenca']) {
  const p = documentacionKayakDeProvincia(id);
  if (!p) throw new Error('falta ' + id);
  if (p.mar !== null) throw new Error(id + ' no debe tener mar en app');
  if (!p.embalse.pesca.length || !p.embalse.navegacion.length) {
    throw new Error(id + ' embalse incompleto');
  }
}
if (!/DESDE TIERRA/i.test(REGLAS_EMBARCACION_MAR[0])) throw new Error('regla[0] kayak tierra');
if (!/DESDE EMBARCACI[OÓ]N/i.test(REGLAS_EMBARCACION_MAR[1])) throw new Error('regla[1] barco');
if (!CHECKLIST_EMBARCACION.some((t) => /artefacto flotante|DESDE TIERRA/i.test(t))) {
  throw new Error('checklist sin kayak desde tierra');
}
console.log('RUNTIME_OK documentacion_kayak');
`;

const run = spawnSync("npx", ["--yes", "tsx", "-e", runtime], {
  cwd: root,
  encoding: "utf8",
  timeout: 60_000,
});
if (run.status !== 0) {
  fail(`runtime: ${(run.stderr || run.stdout || "").slice(0, 800)}`);
} else if (!(run.stdout || "").includes("RUNTIME_OK")) {
  fail("runtime sin RUNTIME_OK");
} else ok("runtime documentacion_kayak");

const pkg = read("package.json");
if (!pkg.includes("assert_documentacion_kayak.mjs")) {
  fail("package.json debe incluir assert_documentacion_kayak.mjs");
} else ok("package.json cablea assert");

if (fallos) {
  console.error(`\n${fallos} fallo(s)`);
  process.exit(1);
}
console.log("\nassert_documentacion_kayak OK");
