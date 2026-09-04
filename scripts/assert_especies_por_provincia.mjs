/**
 * Smoke test: catálogo Sevilla no debe arrastrar textos de Castellón/GVA
 * (p. ej. tenencia de siluro, Sitjar, Orden 30/2016).
 *
 * Uso: node scripts/assert_especies_por_provincia.mjs
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const speciesBase = JSON.parse(readFileSync(join(root, "src/data/species.json"), "utf8"));
const overrides = JSON.parse(
  readFileSync(join(root, "src/provincias/sevilla/speciesOverrides.json"), "utf8")
);
const extras = JSON.parse(
  readFileSync(join(root, "src/provincias/sevilla/speciesExtra.json"), "utf8")
);
const configSrc = readFileSync(join(root, "src/provincias/sevilla/config.ts"), "utf8");

const PROHIBIDOS_SEVILLA = [
  /Sitjar/i,
  /Sichar/i,
  /Mar[ií]a Cristina/i,
  /Aren[oó]s/i,
  /Ulldecona/i,
  /Orden 30\/2016/i,
  /Comunitat Valenciana/i,
  /tenencia.*transporte/i,
  /agentes medioambientales/i,
  /\bGVA\b/,
  /Castell[oó]n/i,
  /talla m[ií]nima de 8 cm/i,
];

const IDS = ["siluro", "black_bass", "lucio", "carpa", "carpin", "cangrejo_americano"];

function textoEspecie(sp) {
  return JSON.stringify(sp);
}

let fallos = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  fallos++;
}

function ok(msg) {
  console.log("OK:", msg);
}

if (/from\s+[\"'].*species\.json[\"']/.test(configSrc)) {
  fail("sevilla/config.ts no debe importar src/data/species.json");
} else {
  ok("Sevilla config no importa species.json de Castellón");
}

const siluroCs = speciesBase.find((s) => s.id === "siluro");
if (!siluroCs?.normativaEspecial?.includes("Comunitat Valenciana")) {
  fail("species.json (Castellón) debería conservar normativa CV del siluro");
} else {
  ok("Castellón siluro conserva tenencia/notificación CV");
}

const overrideMap = new Map(overrides.map((o) => [o.id, o]));
for (const id of IDS) {
  if (!overrideMap.has(id)) fail(`Falta override Sevilla para ${id}`);
}

for (const o of overrides) {
  const blob = textoEspecie(o);
  for (const re of PROHIBIDOS_SEVILLA) {
    if (re.test(blob)) fail(`Override ${o.id} contiene patrón prohibido: ${re}`);
  }
  if (o.id === "siluro") {
    if (!/no es especie objeto de pesca/i.test(blob)) {
      fail("Siluro Sevilla debe indicar que no es objeto de pesca");
    }
    if (/PROHIBIDA la tenencia/i.test(blob)) {
      fail("Siluro Sevilla no debe usar régimen de tenencia CV");
    }
  }
}

for (const e of extras) {
  const blob = textoEspecie(e);
  for (const re of PROHIBIDOS_SEVILLA) {
    if (re.test(blob)) fail(`Extra ${e.id} contiene patrón prohibido: ${re}`);
  }
}

// Catálogo Sevilla = overrides + extras (sin fusionar base CV).
const catalogoSevilla = [];
for (const o of overrides) catalogoSevilla.push({ ...o, provinciaId: "sevilla" });
for (const e of extras) {
  const i = catalogoSevilla.findIndex((s) => s.id === e.id);
  if (i >= 0) catalogoSevilla[i] = { ...catalogoSevilla[i], ...e, provinciaId: "sevilla" };
  else catalogoSevilla.push({ ...e, provinciaId: "sevilla" });
}

for (const sp of catalogoSevilla) {
  const blob = textoEspecie(sp);
  for (const re of PROHIBIDOS_SEVILLA) {
    if (re.test(blob)) fail(`Catálogo Sevilla ${sp.id}: ${re}`);
  }
}

const siluroSv = catalogoSevilla.find((s) => s.id === "siluro");
ok(`Siluro Sevilla normativaEspecial: ${siluroSv.normativaEspecial.slice(0, 80)}…`);
ok(`Hábitats siluro Sevilla: ${siluroSv.habitats}`);

if (fallos) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log(`\nTodo OK · ${catalogoSevilla.length} especies Sevilla, sin cruce CV.`);
