/**
 * Assert auditoría pesca continental (CS / SE / CO / CU):
 * estados ZPL, centroides ICV, Buendía subtramo, Cristinas, radio VP, etc.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let fallos = 0;
function fail(msg) {
  console.error("FAIL", msg);
  fallos++;
}
function ok(msg) {
  console.log("OK", msg);
}
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}
function readJson(rel) {
  return JSON.parse(read(rel));
}
function distKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const zones = readJson("src/data/zones.json");
const tramos = readJson("src/data/tramosOficiales.json");
const geo = read("src/services/geoService.ts");
const consulta = read("src/services/consultaPescaService.ts");

// ——— Castellón: ZPL embalses no son «controlada» ———
for (const id of ["embalse_arenos", "embalse_sichar", "embalse_maria_cristina", "embalse_ulldecona"]) {
  const z = zones.find((x) => x.id === id);
  if (!z) fail(`falta zona ${id}`);
  else if (z.estadoZona === "controlada") fail(`${id} no debe ser controlada (es ZPL)`);
  else if (z.estadoZona !== "libre" && z.estadoZona !== "libre_sin_muerte") {
    fail(`${id} estadoZona inesperado: ${z.estadoZona}`);
  }
}
ok("ZPL embalses CS sin estado controlada");

if (!geo.includes('estado === "libre"') && !geo.includes('=== "libre"')) {
  fail("geoService debe tratar estadoZona libre además de libre_sin_muerte");
} else {
  ok("geoService reconoce libre / libre_sin_muerte");
}

// ——— Teresa / Villahermosa cerca de ICV ———
const teresa = zones.find((z) => z.id === "rio_palancia_teresa_libre");
const villah = zones.find((z) => z.id === "rio_villahermosa_alto");
const p173 = tramos.find((t) => t.id === "p17.3");
const v1021 = tramos.find((t) => t.id === "v10.21");
if (!teresa || distKm(teresa.lat, teresa.lng, 39.8973, -0.6789) > 1.5) {
  fail("Teresa zona lejos del corredor ICV CS-008");
}
if (!p173 || distKm(p173.lat, p173.lng, 39.8973, -0.6789) > 1.5) {
  fail("p17.3 lejos del ICV CS-008");
}
if (!villah || distKm(villah.lat, villah.lng, 40.1762, -0.3971) > 2.5) {
  fail("Villahermosa zona lejos del ICV CS-011");
}
if (!v1021 || distKm(v1021.lat, v1021.lng, 40.1762, -0.3971) > 2.5) {
  fail("v10.21 lejos del ICV CS-011");
}
ok("Teresa/Villahermosa alineados con ICV");

// ——— Regajo dual resuelto: Segorbe ≠ Regajo embalse ———
const segorbe = zones.find((z) => z.id === "rio_palancia_regajo");
const regajo = zones.find((z) => z.id === "embalse_regajo_libre");
if (!segorbe || !regajo) fail("faltan fichas Regajo/Segorbe");
else if (distKm(segorbe.lat, segorbe.lng, regajo.lat, regajo.lng) < 1) {
  fail("Segorbe CS-009 y Regajo ZPL no pueden compartir el mismo punto");
} else if (segorbe.estadoZona !== "controlada") {
  fail("Segorbe debe seguir controlada (coto)");
} else {
  ok("Segorbe y Regajo ya no colisionan");
}

// ——— Arenós sitio fácil fuera del VP pie de presa ———
const sitios = read("src/data/sitiosFaciles.ts");
const arenosMatch = sitios.match(/id: "cs-arenos"[\s\S]*?lat: ([0-9.]+)[\s\S]*?lng: (-?[0-9.]+)/);
if (!arenosMatch) fail("falta cs-arenos en sitiosFaciles");
else {
  const lat = Number(arenosMatch[1]);
  const lng = Number(arenosMatch[2]);
  const dVp = distKm(lat, lng, 40.08753, -0.54255);
  if (dVp <= 0.6) fail(`cs-arenos (${lat},${lng}) cae en radio VP m10.4 (${dVp.toFixed(2)} km)`);
  else ok(`cs-arenos fuera del VP pie de presa (${dVp.toFixed(2)} km)`);
}

// ——— Castellón ZPC usa infoPermisoCoto + sede ———
if (!consulta.includes('infoPermisoCoto("castellon"') && !consulta.includes("infoPermisoCoto('castellon'")) {
  fail("consultaPescaService ZPC Castellón debe llamar infoPermisoCoto");
} else {
  ok("ZPC Castellón con infoPermisoCoto");
}
if (!consulta.includes('aprovechamiento === "VP"') || !consulta.includes("tramoUsaRadioAnexo")) {
  fail("tramoUsaRadioAnexo debe forzar radio en VP/ZRTC");
} else if (!/aprovechamiento === "VP"[\s\S]{0,80}ZRTC/.test(consulta)) {
  fail("VP/ZRTC radio de seguridad no cableado en tramoUsaRadioAnexo");
} else {
  ok("Radio de seguridad VP/ZRTC activo");
}

// ——— Cuenca Buendía / Cristinas ———
const zonesCu = readJson("src/provincias/cuenca/zones.json");
const tramosCu = readJson("src/provincias/cuenca/tramosOficiales.json");
const buendiaZ = zonesCu.find((z) => z.id === "embalse_de_buendia");
const buendiaT = tramosCu.find((t) => t.id === "cue-embalse_de_buendia");
if (!buendiaZ?.descripcion?.includes("presa") || !/Alcocer/i.test(buendiaZ.descripcion)) {
  fail("Buendía descripcion debe limitar cupo al subtramo presa→Alcocer");
}
if (!buendiaT?.regimen?.includes("Alcocer") || /cupo barbos 6\/día \(Orden/.test(buendiaT.regimen)) {
  fail("Buendía regimen de tramo no debe sugerir cupo 6 en todo el vaso");
}
ok("Buendía cupo solo subtramo en ficha/tramo");

const cristinasZ = zonesCu.find((z) => z.id === "rio_cabriel_cristinas");
const cristinasT = tramosCu.find((t) => t.id === "cue-rio_cabriel_cristinas");
if (!cristinasZ || distKm(cristinasZ.lat, cristinasZ.lng, 39.912, -1.723) > 1.5) {
  fail("Cristinas libre debe estar en Pajaroncillo (~39.912,-1.723)");
}
if (!/Pajaroncillo/i.test(cristinasZ.municipio || "")) {
  fail("Cristinas municipio debe ser Pajaroncillo");
}
if (!cristinasT || distKm(cristinasT.lat, cristinasT.lng, 39.912, -1.723) > 1.5) {
  fail("tramo Cristinas mal situado");
}
if (!zonesCu.find((z) => z.id === "coto_especial_cristinas")) {
  fail("falta coto especial Cristinas (Anexo II)");
}
if (!tramosCu.find((t) => t.id === "cue-coto_especial_cristinas" && t.aprovechamiento === "ZPC")) {
  fail("falta tramo ZPC coto especial Cristinas");
}
ok("Cristinas libre + coto especial");

// ——— Andalucía: Melonares no en habitats de especies ———
const sppSe = read("src/provincias/sevilla/speciesExtra.json");
if (/colas de Minilla, Cala y Melonares/i.test(sppSe) || /colas de Cala y Melonares"/i.test(sppSe)) {
  fail("speciesExtra no debe recomendar colas del refugio Melonares");
} else {
  ok("Melonares fuera de habitats barbo/boga");
}

const bembezar = readJson("src/provincias/cordoba/zones.json").find(
  (z) => z.id === "refugio_embalse_del_bembezar"
);
if (!bembezar?.avisos?.length || !/1,?5\s*km/i.test(bembezar.avisos.join(" "))) {
  fail("Bembézar debe avisos con excepción 1,5 km margen izquierda");
} else {
  ok("Bembézar excepción DERA en avisos");
}

const tramosSe = readJson("src/provincias/sevilla/tramosOficiales.json");
const tramosCo = readJson("src/provincias/cordoba/tramosOficiales.json");
if (!tramosSe.find((t) => t.id === "sev-refugio_retortillo_margen_cordoba")) {
  fail("Sevilla debe cubrir refugio Retortillo margen Córdoba");
}
if (!tramosCo.find((t) => t.id === "cor-refugio_retortillo_margen_sevilla")) {
  fail("Córdoba debe cubrir refugio Retortillo margen Sevilla");
}
ok("Retortillo: radios cruzados SE↔CO");

const pkg = read("package.json");
if (!pkg.includes("assert_auditoria_continental.mjs")) {
  fail("package.json debe cablear assert_auditoria_continental.mjs");
}

if (fallos) {
  console.error(`assert_auditoria_continental: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_auditoria_continental");
