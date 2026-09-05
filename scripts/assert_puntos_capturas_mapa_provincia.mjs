/**
 * Smoke: puntos y capturas geolocalizados aparecen en Mapa (Mis sitios)
 * y las coordenadas deben caer dentro de la provincia seleccionada.
 * Uso: node scripts/assert_puntos_capturas_mapa_provincia.mjs
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

const geo = read("src/services/geoService.ts");
if (!/export function asegurarCoordsEnProvincia/.test(geo)) {
  fail("geoService debe exportar asegurarCoordsEnProvincia");
}
if (!/fuera de/.test(geo) && !/Fuera de/.test(geo) && !/quedan fuera/.test(geo)) {
  fail("asegurarCoordsEnProvincia debe avisar si el punto está fuera");
}

const sitios = read("src/services/sitiosPersonalesService.ts");
if (!/export function listarSitiosPersonales/.test(sitios)) {
  fail("falta listarSitiosPersonales");
}
if (!/tipo: "punto" \| "captura"/.test(sitios) && !/"punto"/.test(sitios)) {
  fail("sitiosPersonales debe tipar punto|captura");
}

const busqueda = read("src/services/busquedaService.ts");
if (!/"punto"/.test(busqueda) || !/"captura"/.test(busqueda)) {
  fail("buscarZonas debe aceptar tipos punto y captura");
}
if (!/sitiosPersonales/.test(busqueda)) {
  fail("buscarZonas debe recibir sitiosPersonales");
}

const mapa = read("src/screens/ZonasLibresScreen.tsx");
for (const needle of [
  "obtenerCapturas",
  "listarSitiosPersonales",
  "asegurarCoordsEnProvincia",
  "Mis sitios",
  "sitiosPersonales",
  "PIN.captura",
  'tipo === "captura"',
]) {
  if (!mapa.includes(needle)) fail(`ZonasLibresScreen no incluye ${needle}`);
}

const catches = read("src/screens/MyCatchesScreen.tsx");
for (const needle of [
  "asegurarCoordsEnProvincia",
  "verCapturaEnMapa",
  "Fuera de ${provincia.nombre}",
]) {
  if (!catches.includes(needle)) fail(`MyCatchesScreen no incluye ${needle}`);
}

const salgo = read("src/screens/SalgoAPescarScreen.tsx");
for (const needle of ["asegurarCoordsEnProvincia", "listarSitiosPersonales", "Tus puntos y capturas"]) {
  if (!salgo.includes(needle)) fail(`SalgoAPescarScreen no incluye ${needle}`);
}

const tema = read("src/theme.ts");
if (!/captura:\s*COLORS\.water/.test(tema) && !/captura:/.test(tema)) {
  fail("theme PIN debe incluir captura");
}

const pkg = read("package.json");
if (!pkg.includes("assert_puntos_capturas_mapa_provincia.mjs")) {
  fail("package.json assert debe incluir assert_puntos_capturas_mapa_provincia.mjs");
}

console.log("OK: puntos/capturas en Mapa · coords dentro de provincia");
