/**
 * Flujo lógico: con punto ya elegido (Salgo a pescar / Mapa), Especies muestra
 * la lista del sitio — no vuelve a pedir el mapa. Aparejo = equipo; Especies = especies.
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

const nav = read("src/navigation/irATab.ts");
if (!nav.includes("irAEspeciesDelPunto") || !nav.includes("pedirAbrirConsultaEspecies")) {
  fail("irATab debe pedir abrir consulta especies (singleton + navigate)");
}

const pendiente = read("src/services/especiesPendiente.ts");
if (!pendiente.includes("pedirAbrirConsultaEspecies") || !pendiente.includes("consumirAbrirConsultaEspecies")) {
  fail("especiesPendiente debe exponer pedir/consumir abrir consulta");
}

const especies = read("src/screens/EspeciesScreen.tsx");
for (const needle of [
  "aplicarPuntoCompartido",
  "useFocusEffect",
  "abrirConsulta",
  "puntoAplicadoRef",
  "Ver especies de este punto",
  "Punto ya elegido",
  "consumirAbrirConsultaEspecies",
]) {
  if (!especies.includes(needle)) fail(`EspeciesScreen sin ${needle}`);
}

if (!especies.includes("punto.fuente") || !especies.includes("usePuntoConsulta")) {
  fail("EspeciesScreen debe leer el punto compartido (no solo fijarPunto)");
}

const card = read("src/components/ConsultaPescaCard.tsx");
for (const needle of ["onEspecies", "Ver especies de este punto", "Ver aparejo de la especie destacada"]) {
  if (!card.includes(needle)) fail(`ConsultaPescaCard sin ${needle}`);
}

const salgo = read("src/screens/SalgoAPescarScreen.tsx");
if (!salgo.includes("onEspecies") || !salgo.includes("irAEspeciesDelPunto")) {
  fail("Salgo a pescar debe enlazar Especies del punto (no solo Aparejo)");
}

const home = read("src/screens/HomeScreen.tsx");
if (!home.includes("onEspecies") || !home.includes("irAEspeciesDelPunto")) {
  fail("Inicio debe enlazar Especies del punto");
}

const mapa = read("src/screens/ZonasLibresScreen.tsx");
if (!mapa.includes("onEspecies") || !mapa.includes("irAEspeciesDelPunto")) {
  fail("Mapa debe enlazar Especies del punto");
}

const aparejos = read("src/screens/AparejosScreen.tsx");
if (!aparejos.includes("Equipo recomendado por especie")) {
  fail("Aparejos debe aclarar que es equipo, no selector de sitio");
}

const pkg = read("package.json");
if (!pkg.includes("assert_flujo_especies_aparejo.mjs")) {
  fail("package.json assert debe incluir assert_flujo_especies_aparejo.mjs");
}

console.log("OK: flujo Especies / Aparejo respeta el punto ya elegido");
