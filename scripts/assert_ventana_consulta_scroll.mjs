/**
 * El sheet de consulta (especies del punto, catálogo, mapa) debe poder hacer
 * scroll cuando el listado supera la altura visible. Sin maxHeight en el
 * ScrollView, overflow:hidden del sheet recorta el contenido.
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

const src = fs.readFileSync(path.join(root, "src/components/VentanaConsulta.tsx"), "utf8");

if (!src.includes("ScrollView")) fail("VentanaConsulta debe usar ScrollView");
if (!src.includes("maxHeight: SHEET_MAX_H - SHEET_HEADER_H") && !src.includes("maxHeight: SHEET_MAX_H -")) {
  fail("VentanaConsulta: el cuerpo scrolleable debe tener maxHeight acotado (no solo flexGrow)");
}
if (!src.includes("minHeight: 0")) {
  fail("VentanaConsulta: cuerpo necesita minHeight: 0 para que flex permita scroll (web)");
}
if (!src.includes("flexShrink: 1") && !src.includes("flexShrink:1")) {
  fail("VentanaConsulta: cuerpo debe poder encogerse (flexShrink)");
}
if (!/cuerpo:\s*\{\s*flexGrow:\s*1\s*\}/.test(src.replace(/\s+/g, " "))) {
  // Solo flexGrow sin tope es el bug antiguo; si hay más props en cuerpo, OK.
  const cuerpoMatch = src.match(/cuerpo:\s*\{([^}]+)\}/s);
  if (!cuerpoMatch) fail("VentanaConsulta sin estilo cuerpo");
  if (!cuerpoMatch[1].includes("maxHeight")) {
    fail("VentanaConsulta estilo cuerpo sin maxHeight (regresión de scroll)");
  }
}

const pkg = fs.readFileSync(path.join(root, "package.json"), "utf8");
if (!pkg.includes("assert_ventana_consulta_scroll.mjs")) {
  fail("package.json assert debe incluir assert_ventana_consulta_scroll.mjs");
}

console.log("OK: VentanaConsulta acota el ScrollView para poder hacer scroll");
