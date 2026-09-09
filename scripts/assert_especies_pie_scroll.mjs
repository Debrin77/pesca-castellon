/**
 * Especies: mapa grande + scroll para ver «Ver última consulta» y «Catálogo»
 * por encima de la barra de tabs (mismo patrón que Mapa).
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

if (!src.includes("ScrollView")) fail("EspeciesScreen debe usar ScrollView (mapa grande + pie scrolleable)");
if (!src.includes("altoMapa")) fail("EspeciesScreen sin altoMapa (mapa protagonista)");
if (!src.includes("0.58") && !src.includes("0.62")) {
  fail("EspeciesScreen altoMapa debe ser ~58–62% de la pantalla");
}
if (!src.includes("piePadBottom") && !src.includes("useSafeAreaInsets")) {
  fail("EspeciesScreen necesita hueco inferior (piePadBottom / safe area) al final del scroll");
}
if (!src.includes("Ver última consulta")) fail("EspeciesScreen sin CTA Ver última consulta");
if (!src.includes("Catálogo ríos") && !src.includes("Catálogo orilla")) {
  fail("EspeciesScreen sin CTAs de catálogo en el pie");
}
if (!src.includes("scrollMapa")) fail("EspeciesScreen sin scrollMapa");

const pkg = fs.readFileSync(path.join(root, "package.json"), "utf8");
if (!pkg.includes("assert_especies_pie_scroll.mjs")) {
  fail("package.json assert debe incluir assert_especies_pie_scroll.mjs");
}

console.log("OK: Especies mapa grande + pie scrolleable sobre la barra de tabs");
