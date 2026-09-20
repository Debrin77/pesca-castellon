/**
 * Assert: reanudar sesión con claridad + capturas/rutas nunca se borran al cambiar.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
let fallos = 0;

function fail(msg) {
  console.error(`FAIL ${msg}`);
  fallos++;
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const ctx = read("src/context/ProvinciaContext.tsx");
for (const n of ["restauradaAlArrancar", "selectorEsCambio", "CLAVE_PROVINCIA"]) {
  if (!ctx.includes(n)) fail(`ProvinciaContext sin ${n}`);
}
if (!ctx.includes("setRestauradaAlArrancar(true)")) {
  fail("ProvinciaContext debe marcar restauradaAlArrancar al leer almacenamiento");
}
if (!ctx.includes("setSelectorEsCambio(true)")) {
  fail("cambiarProvincia debe marcar selectorEsCambio");
}

const util = read("src/utils/confirmarCambiarProvincia.ts");
for (const n of [
  "confirmarCambiarProvincia",
  "se quedan guardados",
  "capturas, puntos y rutas",
]) {
  if (!util.includes(n)) fail(`confirmarCambiarProvincia sin ${n}`);
}

const home = read("src/screens/HomeScreen.tsx");
for (const n of [
  "Sigues en",
  "avisoSesionVisible",
  "restauradaAlArrancar",
  "confirmarCambiarProvincia",
  "Sesión anterior",
]) {
  if (!home.includes(n)) fail(`HomeScreen sin ${n}`);
}

const ajustes = read("src/screens/AjustesScreen.tsx");
if (!ajustes.includes("confirmarCambiarProvincia")) {
  fail("Ajustes debe confirmar antes de cambiar provincia");
}
if (!ajustes.includes("no se borra el cuaderno")) {
  fail("Ajustes debe aclarar que el cuaderno no se borra");
}

const sel = read("src/screens/SelectorProvinciaScreen.tsx");
if (!sel.includes("se mantienen") || !sel.includes("desdeAjustes")) {
  fail("Selector debe explicar conservación al cambiar provincia");
}

const app = read("App.tsx");
if (!app.includes("desdeAjustes={selectorEsCambio}")) {
  fail("App debe pasar desdeAjustes al selector según selectorEsCambio");
}

const storage = read("src/services/storageService.ts");
const tracks = read("src/services/trackService.ts");
if (storage.includes("removeItem") && /cambiarProvincia|clearProvincia/.test(storage)) {
  fail("storageService no debe borrar capturas al cambiar provincia");
}
if (tracks.includes("removeItem") && /cambiarProvincia|clearProvincia/.test(tracks)) {
  fail("trackService no debe borrar rutas al cambiar provincia");
}

const pkg = read("package.json");
if (!pkg.includes("assert_sesion_reanudar_provincia.mjs")) {
  fail("package.json assert debe incluir assert_sesion_reanudar_provincia.mjs");
}

if (fallos) {
  console.error(`assert_sesion_reanudar_provincia: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_sesion_reanudar_provincia");
