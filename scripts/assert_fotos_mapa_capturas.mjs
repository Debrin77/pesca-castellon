/**
 * Assert: fotos reales de especies, radar sin Zoom Level Not Supported, capturas sin especie forzada.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
let fallos = 0;
function fail(m) {
  console.error("FAIL", m);
  fallos++;
}

const media = fs.readFileSync(path.join(root, "src/data/especiesMedia.ts"), "utf8");
const tarjeta = fs.readFileSync(path.join(root, "src/components/TarjetaEspecie.tsx"), "utf8");
const mapWeb = fs.readFileSync(path.join(root, "src/components/map/index.web.tsx"), "utf8");
const mapNative = fs.readFileSync(path.join(root, "src/components/map/index.native.tsx"), "utf8");
const catches = fs.readFileSync(path.join(root, "src/screens/MyCatchesScreen.tsx"), "utf8");

if (!media.includes("fotoEspecie") || !media.includes("trucha_comun.jpg")) {
  fail("especiesMedia sin fotoEspecie / fotos jpg");
}
if (!tarjeta.includes("fotoEspecie") || !tarjeta.includes("fotoReal")) {
  fail("TarjetaEspecie debe mostrar foto real");
}

const dir = path.join(root, "assets/especies");
const jpgs = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".jpg")) : [];
if (jpgs.length < 30) {
  fail(`assets/especies debe tener ≥30 fotos (tiene ${jpgs.length})`);
}

if (!mapWeb.includes("maxNativeZoom={7}") || !mapWeb.includes("PIXEL_TRANSPARENTE")) {
  fail("mapa web: radar maxNativeZoom 7 + errorTileUrl transparente");
}
if (!mapNative.includes("maximumZ={7}")) {
  fail("mapa native: radar maximumZ 7");
}

if (catches.includes("useState(speciesCatalog[0]") || /setEspecieId\(speciesCatalog\[0\]/.test(catches)) {
  fail("Capturas no debe preseleccionar speciesCatalog[0] (trucha/siluro)");
}
if (!catches.includes('useState("")') || !catches.includes("Elige la especie")) {
  fail("Capturas debe empezar sin especie y pedir elección");
}

if (fallos) {
  console.error(`assert_fotos_mapa_capturas: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_fotos_mapa_capturas");
