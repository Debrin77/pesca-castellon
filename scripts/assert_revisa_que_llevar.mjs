/**
 * Assert: «Revisa qué llevar» (irAChecklist) no se queda en bucle de carga.
 * El focus effect debe consumir el param one-shot antes de fijarPunto;
 * si no, al actualizar `punto` se re-lanza aplicarUbicacion sin fin.
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
  "setParams?.({ irAChecklist: undefined })",
]) {
  if (!salgo.includes(n)) fail(`SalgoAPescarScreen sin ${n}`);
}

// Debe limpiar el param al entrar (antes del await), no solo al final de aplicarUbicacion.
const idxFocus = salgo.indexOf("useFocusEffect");
const idxClearInFocus = salgo.indexOf("setParams?.({ irAChecklist: undefined })", idxFocus);
const idxAuto = salgo.indexOf("autoChecklistLanzado.current = true", idxFocus);
if (idxFocus < 0 || idxClearInFocus < 0 || idxAuto < 0) {
  fail("SalgoAPescarScreen: focus effect debe consumir irAChecklist y marcar autoChecklistLanzado");
} else if (!(idxClearInFocus < idxAuto)) {
  fail("SalgoAPescarScreen: debe limpiar irAChecklist antes de lanzar autoChecklist");
}

if (!salgo.includes("!autoChecklistLanzado.current")) {
  fail("SalgoAPescarScreen: el auto-checklist debe guardarse con !autoChecklistLanzado.current");
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
