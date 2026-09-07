/**
 * Assert: «Revisa qué llevar» (irAChecklist) no se queda en bucle de carga
 * y salta al paso «Qué llevar».
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
  "irAChecklist",
  "irChecklistPendiente",
  "autoChecklistLanzado",
  "aplicandoRef",
  "puntoRef",
  "saltarAChecklist",
  "irAlChecklistUi",
  "setParams?.({ irAChecklist: undefined })",
  "opts?: { irAChecklist?: boolean }",
]) {
  if (!salgo.includes(n)) fail(`SalgoAPescarScreen sin ${n}`);
}

const idxFocus = salgo.indexOf("useFocusEffect");
const idxClearInFocus = salgo.indexOf("setParams?.({ irAChecklist: undefined })", idxFocus);
const idxAuto = salgo.indexOf("autoChecklistLanzado.current = true", idxFocus);
if (idxFocus < 0 || idxClearInFocus < 0 || idxAuto < 0) {
  fail("SalgoAPescarScreen: focus effect debe consumir irAChecklist y marcar autoChecklistLanzado");
} else if (!(idxClearInFocus < idxAuto)) {
  fail("SalgoAPescarScreen: debe limpiar irAChecklist antes de lanzar autoChecklist");
}

// El effect NO debe listar `punto` como dependencia (re-entrada al fijarPunto).
const focusBlock = salgo.slice(idxFocus, idxFocus + 2500);
if (/}, \[aplicarUbicacion, provincia\.id, punto[,\] ]/.test(focusBlock)) {
  fail("SalgoAPescarScreen: useFocusEffect no debe depender de `punto` (bucle con fijarPunto)");
}
if (!focusBlock.includes("puntoRef.current")) {
  fail("SalgoAPescarScreen: auto-checklist debe leer el punto vía puntoRef");
}
if (!focusBlock.includes("{ irAChecklist: true }")) {
  fail("SalgoAPescarScreen: auto-checklist debe pasar irAChecklist: true a aplicarUbicacion");
}

const card = read("src/components/SiguientePasoCard.tsx");
if (!card.includes("Revisa qué llevar") || !card.includes("irAChecklist: true")) {
  fail("SiguientePasoCard debe enlazar «Revisa qué llevar» con irAChecklist");
}

const pkg = read("package.json");
if (!pkg.includes("assert_revisa_que_llevar.mjs")) {
  fail("package.json assert debe incluir assert_revisa_que_llevar.mjs");
}

if (fallos) {
  console.error(`assert_revisa_que_llevar: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_revisa_que_llevar");
