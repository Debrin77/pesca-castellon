/**
 * Assert: facilidad de uso previa a Android —
 * certeza en el primer veredicto, Aparejos alineado al modo,
 * Licencia/Ajustes visibles, sin «checklist» en copy de barco.
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

const home = read("src/screens/HomeScreen.tsx");
for (const n of [
  "certezaDeConsulta",
  "certezaHero",
  "veredictoRapidoSello",
  "veredictoRapidoAprox",
  "puntoNoEncajaModo",
  'navigate("License")',
  'navigate("Ajustes")',
  "headerRight",
  "ambitoModo",
]) {
  if (!home.includes(n)) fail(`HomeScreen sin ${n}`);
}
if (home.includes("oleaje · checklist")) {
  fail("Home no debe mostrar «checklist» en el CTA de barco");
}

const modo = read("src/data/modoPesca.ts");
if (!modo.includes("modoAAparejoAmbito")) fail("modoPesca sin modoAAparejoAmbito");

const aparejos = read("src/screens/AparejosScreen.tsx");
for (const n of ["useModoPesca", "modoAAparejoAmbito", "setModoGlobal", "ambitoModo"]) {
  if (!aparejos.includes(n)) fail(`AparejosScreen sin ${n}`);
}

const especies = read("src/screens/EspeciesScreen.tsx");
for (const n of ["consultarEmbarcacion", 'modoGlobal === "barco"']) {
  if (!especies.includes(n)) fail(`EspeciesScreen sin ${n}`);
}

const tarjeta = read("src/components/TarjetaPuntoHoy.tsx");
if (!tarjeta.includes("certeza.sello") || !tarjeta.includes("certezaDeConsulta")) {
  fail("TarjetaPuntoHoy debe mostrar certeza.sello en ¿Puedo?");
}

const barco = read("src/screens/SalgoEnBarcoScreen.tsx");
if (barco.includes("Siguiente · checklist") || barco.includes("checklist · carta")) {
  fail("SalgoEnBarco no debe mostrar «checklist» al usuario");
}
for (const n of ["qué llevar", "Qué llevar"]) {
  if (!barco.includes(n)) fail(`SalgoEnBarco sin «${n}»`);
}

const capturas = read("src/screens/MyCatchesScreen.tsx");
const bloqueRapida = capturas.slice(
  capturas.indexOf("abrirCapturaRapida"),
  capturas.indexOf("abrirCapturaRapida") + 800
);
if (bloqueRapida.includes("anadirUbicacionCapturaGps()") || bloqueRapida.includes("tomarFotoCamara()")) {
  fail("Captura rápida no debe auto-pedir GPS/cámara");
}

const pkg = read("package.json");
if (!pkg.includes("assert_ux_facilidad_pre_android.mjs")) {
  fail("package.json assert debe incluir assert_ux_facilidad_pre_android.mjs");
}

if (fallos) {
  console.error(`assert_ux_facilidad_pre_android: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_ux_facilidad_pre_android");
