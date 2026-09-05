/**
 * Smoke: previsión ligada al punto del mapa (no solo GPS).
 * Uso: node scripts/assert_prevision_punto_mapa.mjs
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

let fallos = 0;
function fail(m) {
  console.error("FAIL:", m);
  fallos++;
}
function ok(m) {
  console.log("OK:", m);
}

const prev = readFileSync(join(root, "src/screens/PrevisionScreen.tsx"), "utf8");
const mapa = readFileSync(join(root, "src/screens/ZonasLibresScreen.tsx"), "utf8");
const esp = readFileSync(join(root, "src/screens/EspeciesScreen.tsx"), "utf8");
const home = readFileSync(join(root, "src/screens/HomeScreen.tsx"), "utf8");
const avisos = readFileSync(join(root, "src/services/avisosSeguridadService.ts"), "utf8");
const app = readFileSync(join(root, "App.tsx"), "utf8");

if (!app.includes("PuntoConsultaProvider")) fail("App debe envolver PuntoConsultaProvider");
else ok("PuntoConsultaProvider en App");

if (!mapa.includes("fijarPunto")) fail("Mapa debe publicar punto de consulta");
else ok("Mapa publica fijarPunto");

if (!esp.includes("fijarPunto")) fail("Especies debe publicar punto de consulta");
else ok("Especies publica fijarPunto");

if (!esp.includes("aplicarPuntoCompartido") || !esp.includes("abrirConsulta")) {
  fail("Especies debe reutilizar el punto compartido y abrir la ficha");
} else {
  ok("Especies reutiliza punto compartido (abrirConsulta)");
}

if (!prev.includes("usePuntoConsulta")) fail("Previsión debe leer punto de consulta");
else ok("Previsión usa usePuntoConsulta");

if (!prev.includes("Usar mi GPS")) fail("Previsión debe ofrecer volver a GPS");
else ok("Previsión tiene Usar mi GPS");

if (!home.includes("usePuntoConsulta")) fail("Inicio debe usar punto de consulta para clima");
else ok("Inicio usa punto de consulta");

const salgo = readFileSync(join(root, "src/screens/SalgoAPescarScreen.tsx"), "utf8");
if (!salgo.includes("fijarPunto") || !salgo.includes("usePuntoConsulta")) {
  fail("Salgo a pescar debe publicar/leer punto de consulta");
} else {
  ok("Salgo a pescar usa punto de consulta");
}

if (!prev.includes("Población de referencia") && !prev.includes("poblacion")) {
  fail("Previsión debe mostrar población de referencia");
} else {
  ok("Previsión muestra población de referencia");
}

const poblacionSrc = readFileSync(join(root, "src/services/poblacionCercanaService.ts"), "utf8");
if (!poblacionSrc.includes("resolverPoblacionCercana")) fail("Falta resolverPoblacionCercana");
else ok("Servicio de población cercana");

const puntoSrc = readFileSync(join(root, "src/services/puntoConsultaService.ts"), "utf8");
if (!puntoSrc.includes("poblacion")) fail("PuntoConsulta debe guardar población");
else ok("PuntoConsulta guarda población");

if (fallos) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nTodo OK · previsión anclada al punto del mapa.");
