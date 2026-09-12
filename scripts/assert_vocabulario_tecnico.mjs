/**
 * Assert: vocabulario técnico ilustrado (técnicas/señuelos con foto).
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
function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

const consejos = read("src/data/consejos.ts");
const media = read("src/data/consejosMedia.ts");
const glosario = read("src/data/glosario.ts");
const termino = read("src/components/TerminoAyuda.tsx");
const aparejos = read("src/screens/AparejosScreen.tsx");

const ids = [
  "voc-spinning",
  "voc-surfcasting",
  "voc-texas",
  "voc-dropshot",
  "voc-carolina",
  "voc-football-jig",
  "voc-popper",
  "voc-stickbait",
  "voc-spinnerbait",
  "voc-jerkbait",
  "voc-crankbait",
  "voc-eging",
  "voc-feeder",
  "voc-rockfishing",
  "voc-jighead",
  "voc-topwater",
];

for (const id of ids) {
  if (!consejos.includes(`id: "${id}"`)) fail(`consejos sin item ${id}`);
  if (!consejos.includes(`diagrama: "${id}"`)) fail(`consejos sin diagrama ${id}`);
  if (!media.includes(`"${id}"`)) fail(`consejosMedia sin ${id}`);
  if (!media.includes(`"${id}":`)) fail(`GUIAS_MEDIA sin entrada ${id}`);
}

if (!consejos.includes('id: "voc-solunar"') || !consejos.includes('id: "voc-sm"') || !consejos.includes('id: "voc-saih"')) {
  fail("Vocabulario legal incompleto (solunar/sm/saih)");
}
if ((consejos.match(/id: "voc-saih"/g) || []).length !== 1) {
  fail("voc-saih duplicado o ausente");
}
if (consejos.includes('id: "voc-saih",\n        id: "voc-solunar"')) {
  fail("bug de id duplicado voc-saih/voc-solunar");
}

const fotos = [
  "assets/consejos/aparejos/popper.jpg",
  "assets/consejos/aparejos/stickbait-pencil.jpg",
  "assets/consejos/aparejos/topwater-wobblers.jpg",
  "assets/consejos/aparejos/spinnerbait.jpg",
  "assets/consejos/aparejos/crankbaits.jpg",
  "assets/consejos/aparejos/wobbler-minnow.jpg",
  "assets/consejos/aparejos/montaje-dropshot.jpg",
  "assets/consejos/aparejos/montaje-carolina.jpg",
  "assets/consejos/aparejos/montajes-finesse.jpg",
  "assets/consejos/aparejos/senuelos-jig-varios.jpg",
  "assets/consejos/aparejos/surfcasting-orilla.jpg",
];
for (const f of fotos) {
  if (!exists(f)) fail(`falta foto ${f}`);
}

for (const k of ["spinning", "texas", "dropshot", "popper", "stickbait", "surfcasting"]) {
  if (!glosario.includes(`${k}:`)) fail(`glosario sin ${k}`);
}
if (!glosario.includes("terminosEnTexto") || !glosario.includes("diagramaId") || !glosario.includes("consejoId")) {
  fail("glosario sin terminosEnTexto / diagramaId / consejoId");
}
if (!termino.includes("primeraFotoGuia") || !termino.includes("Ver ficha con foto")) {
  fail("TerminoAyuda sin foto / enlace a Consejos");
}
if (!aparejos.includes("terminosEnTexto") || !aparejos.includes("Qué significa")) {
  fail("AparejosScreen sin chips de vocabulario");
}
if (!media.includes("primeraFotoGuia")) {
  fail("consejosMedia sin primeraFotoGuia");
}

if (fallos) {
  console.error(`assert_vocabulario_tecnico: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_vocabulario_tecnico");
