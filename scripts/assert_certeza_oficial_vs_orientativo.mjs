/**
 * Assert: certeza geométrica visible sin depender del pill (oficial vs orientativo).
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

const data = read("src/data/certezaConsulta.ts");
for (const n of [
  "ORIENTATIVO",
  "OFICIAL",
  "APROXIMADO",
  "orientativo_costa",
  "poligono_icv",
  "No es polígono ICV",
]) {
  if (!data.includes(n)) fail(`certezaConsulta sin ${n}`);
}

const sem = read("src/components/SemaforoVeredicto.tsx");
for (const n of [
  "certezaDeConsulta",
  "selloBar",
  "envoltorioAprox",
  "borderStyle: \"dashed\"",
  "avisoCerteza",
  "OFICIAL",
]) {
  if (!sem.includes(n) && !(n === "OFICIAL" && sem.includes("certeza.sello"))) {
    // OFICIAL comes from data via certeza.sello — allow either
    if (n === "OFICIAL") continue;
    fail(`SemaforoVeredicto sin ${n}`);
  }
}
if (!sem.includes("certeza.sello")) fail("SemaforoVeredicto debe mostrar certeza.sello");

const card = read("src/components/ConsultaPescaCard.tsx");
for (const n of ["certezaDeConsulta", "certezaChip", "certeza.sello", "certeza.aviso"]) {
  if (!card.includes(n)) fail(`ConsultaPescaCard sin ${n}`);
}
// No debe volver al pill débil como única señal
if (card.includes("Polígono de consulta (orientativo)") && !card.includes("certezaChip")) {
  fail("ConsultaPescaCard no debe depender solo del pill orientativo");
}

const pkg = read("package.json");
if (!pkg.includes("assert_certeza_oficial_vs_orientativo.mjs")) {
  fail("package.json assert debe incluir assert_certeza_oficial_vs_orientativo.mjs");
}

if (fallos) {
  console.error(`assert_certeza_oficial_vs_orientativo: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_certeza_oficial_vs_orientativo");
