/**
 * Assert: en Castellón, Ríos/embalses tiene el equivalente a «Ver especies de orilla»:
 * CTA continental + abrir catálogo de ríos al elegir el modo.
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

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const especies = read("src/screens/EspeciesScreen.tsx");

for (const needle of [
  "abrirCatalogoContinental",
  "Ver especies de ríos y embalses",
  "ctaContinental",
  'cambiarModo("continental", { abrirCatalogo: true })',
  "especies continentales",
  "Catálogo ríos",
  "Especies · Ríos",
]) {
  if (!especies.includes(needle)) fail(`EspeciesScreen sin ${needle}`);
}

// Simetría: Costa abre catálogo; continental también al pulsar el toggle
if (!especies.includes('cambiarModo("costa", { abrirCatalogo: true })')) {
  fail("EspeciesScreen debe abrir catálogo orilla al elegir Costa");
}

// El CTA continental debe existir también fuera de modo costa (no solo orilla)
if (!especies.includes("accessibilityLabel=\"Ver especies de ríos y embalses\"")) {
  fail("CTA continental debe ser accesible con etiqueta clara");
}

// En ficha de consulta continental, enlace al catálogo de ríos
if (!/consulta\.ambito === "maritimo"[\s\S]*abrirCatalogoOrilla[\s\S]*abrirCatalogoContinental/.test(especies)) {
  fail("Ficha de consulta: orilla → catálogo orilla; continental → catálogo ríos");
}

const pkg = read("package.json");
if (!pkg.includes("assert_especies_continental_equivalente.mjs")) {
  fail("package.json assert debe incluir assert_especies_continental_equivalente.mjs");
}

console.log("OK: Castellón · especies continentales con CTA equivalente a costa");
