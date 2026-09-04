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

if (!prev.includes("usePuntoConsulta")) fail("Previsión debe leer punto de consulta");
else ok("Previsión usa usePuntoConsulta");

if (!prev.includes("Usar mi GPS")) fail("Previsión debe ofrecer volver a GPS");
else ok("Previsión tiene Usar mi GPS");

if (!home.includes("usePuntoConsulta")) fail("Inicio debe usar punto de consulta para clima");
else ok("Inicio usa punto de consulta");

if (!avisos.includes("cercaDe")) fail("Avisos caudal deben aceptar cercaDe");
else ok("Avisos caudal priorizan ríos cercanos");

if (fallos) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nTodo OK · previsión anclada al punto del mapa.");
