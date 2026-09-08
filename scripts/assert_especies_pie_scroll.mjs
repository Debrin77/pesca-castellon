/**
 * Especies: «Ver última consulta» y «Catálogo» deben verse por encima de la
 * barra de tabs. El pie es fijo (no queda bajo el overlay) con paddingBottom
 * según safe area + hueco de tabs; el mapa cede altura (flex).
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

if (!src.includes("useSafeAreaInsets")) {
  fail("EspeciesScreen debe usar safe area para el pie sobre la barra de tabs");
}
if (!src.includes("piePadBottom")) {
  fail("EspeciesScreen sin piePadBottom (hueco bajo Catálogo / última consulta)");
}
if (!src.includes("Ver última consulta")) fail("EspeciesScreen sin CTA Ver última consulta");
if (!src.includes("Catálogo ríos") && !src.includes("Catálogo orilla")) {
  fail("EspeciesScreen sin CTAs de catálogo en el pie");
}
if (!src.includes('mapWrap: { flex: 1') && !src.includes("mapWrap: { flex:1")) {
  fail("EspeciesScreen mapWrap debe ser flex:1 para ceder sitio al pie");
}

const pkg = fs.readFileSync(path.join(root, "package.json"), "utf8");
if (!pkg.includes("assert_especies_pie_scroll.mjs")) {
  fail("package.json assert debe incluir assert_especies_pie_scroll.mjs");
}

console.log("OK: Especies pie fijo visible por encima de la barra de tabs");
