/**
 * Assert: escala tipografica TYPE + pines de mapa distinguibles + leyenda de campo.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let fallos = 0;
function fail(m) {
  console.error("FAIL", m);
  fallos++;
}
function read(r) {
  return fs.readFileSync(path.join(root, r), "utf8");
}

const theme = read("src/theme.ts");
for (const k of [
  "export const TYPE",
  "displayVerdict",
  "displaySheet",
  "displayHero",
  "displayTitle",
  "mapChip",
  "mapLegend",
  "overline",
]) {
  if (!theme.includes(k)) fail("theme TYPE falta " + k);
}
if (!theme.includes("a84828")) {
  fail("PIN.captura debe ser terracota distinguible (#a84828)");
}
if (!theme.includes("seleccion:")) {
  fail("PIN.seleccion debe existir para el punto consultado");
}

const leyenda = read("src/components/LeyendaMapa.tsx");
for (const k of ["Tú", "Consulta", "TYPE.mapLegend", "PIN.seleccion", "PIN.captura", "Hoy sí", "Hoy no"]) {
  if (!leyenda.includes(k)) fail("LeyendaMapa falta " + k);
}

const zonas = read("src/screens/ZonasLibresScreen.tsx");
if (!zonas.includes('identifier="seleccion"') || !zonas.includes("PIN.seleccion")) {
  fail("Mapa debe marcar el punto consultado con PIN.seleccion");
}
if (!zonas.includes("TYPE.mapChip") || !zonas.includes("TYPE.caption")) {
  fail("Mapa debe usar TYPE en chips/hints");
}

const web = read("src/webChrome.ts");
if (!web.includes("Fraunces") || !web.includes("Source+Sans+3") || !web.includes("Literata")) {
  fail("webChrome debe cargar Fraunces + Literata + Source Sans 3");
}

const semaforo = read("src/components/SemaforoVeredicto.tsx");
if (!semaforo.includes("TYPE.displayVerdict")) {
  fail("SemaforoVeredicto debe usar TYPE.displayVerdict");
}

const ventana = read("src/components/VentanaConsulta.tsx");
if (!ventana.includes("TYPE.displaySheet")) {
  fail("VentanaConsulta debe usar TYPE.displaySheet");
}

const consejos = read("src/screens/ConsejosScreen.tsx");
if (!consejos.includes("TYPE.displayHero") || !consejos.includes("TYPE.displayTitle")) {
  fail("Consejos debe usar TYPE display en hero/secciones");
}

const home = read("src/screens/HomeScreen.tsx");
if (!home.includes("LogoMarcaEstatico") && !home.includes("TYPE.displayHero") && !home.includes("FONTS.display")) {
  fail("Home debe usar logo de marca o display tipografico");
}

const geo = read("src/services/geojsonHit.ts");
if (!geo.includes("#246b3d")) {
  fail("colorCapaIcv ZPL debe alinearse con PIN.libre");
}

const pkg = read("package.json");
if (!pkg.includes("assert_tipografia_mapas.mjs")) {
  fail("package.json debe incluir assert_tipografia_mapas.mjs");
}

if (fallos) {
  console.error("assert_tipografia_mapas: " + fallos + " fallo(s)");
  process.exit(1);
}
console.log("OK: tipografia TYPE + mapa de campo");
