/**
 * Especies: el pie bajo «Ver especies de este punto» (última consulta / catálogo)
 * no debe quedar atrapado detrás de la barra de tabs. Hace falta ScrollView +
 * paddingBottom suficiente, como en el mapa.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function fail(msg) {
  console.error("FAIL:", msg);
  process.exit(1);
}

const src = fs.readFileSync(path.join(root, "src/screens/EspeciesScreen.tsx"), "utf8");

if (!src.includes("ScrollView")) fail("EspeciesScreen debe usar ScrollView para el pie");
if (!src.includes("scrollMapa")) fail("EspeciesScreen sin scrollMapa (mismo patrón que Mapa)");
if (!src.includes("altoMapa")) fail("EspeciesScreen debe dar altura fija al mapa (no flex sin scroll)");
if (!src.includes("Ver última consulta")) fail("EspeciesScreen sin CTA Ver última consulta");
if (!src.includes("Catálogo ríos") && !src.includes("Catálogo orilla")) {
  fail("EspeciesScreen sin CTAs de catálogo en el pie");
}

const pieMatch = src.match(/pie:\s*\{([^}]+)\}/s);
if (!pieMatch) fail("EspeciesScreen sin estilo pie");
const pad = pieMatch[1].match(/paddingBottom:\s*(\d+)/);
if (!pad || Number(pad[1]) < 110) {
  fail("EspeciesScreen pie.paddingBottom debe dejar hueco para la barra de tabs (>=110)");
}

const pkg = fs.readFileSync(path.join(root, "package.json"), "utf8");
if (!pkg.includes("assert_especies_pie_scroll.mjs")) {
  fail("package.json assert debe incluir assert_especies_pie_scroll.mjs");
}

console.log("OK: Especies pie scrolleable por encima de la barra de tabs");
