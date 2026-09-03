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

// Cargar JSON vía require (sin TS transpile).
const speciesBase = JSON.parse(readFileSync(join(root, "src/data/species.json"), "utf8"));
const overrides = JSON.parse(
  readFileSync(join(root, "src/provincias/sevilla/speciesOverrides.json"), "utf8")
);
const extras = JSON.parse(
  readFileSync(join(root, "src/provincias/sevilla/speciesExtra.json"), "utf8")
);

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

// Castellón base sigue teniendo el régimen valenciano del siluro.
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

// Simular fusión (misma lógica que config.ts)
function metadatosTecnicos(base) {
  return {
    id: base.id,
    nombre: base.nombre,
    nombreCientifico: base.nombreCientifico,
    categoria: base.categoria,
    invasora: base.invasora,
    icono: base.icono,
    mejoresMeses: base.mejoresMeses,
    ventanas: base.ventanas,
    mejorHora: base.mejorHora,
    equipo: base.equipo,
    senuelosClave: base.senuelosClave,
  };
}

const catalogoSevilla = [];
for (const o of overrides) {
  const base = speciesBase.find((s) => s.id === o.id);
  catalogoSevilla.push({
    ...(base ? metadatosTecnicos(base) : {}),
    ...o,
    provinciaId: "sevilla",
  });
}
for (const e of extras) catalogoSevilla.push({ ...e, provinciaId: "sevilla" });

for (const sp of catalogoSevilla) {
  const blob = textoEspecie(sp);
  for (const re of PROHIBIDOS_SEVILLA) {
    if (re.test(blob)) fail(`Catálogo fusionado ${sp.id}: ${re}`);
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
