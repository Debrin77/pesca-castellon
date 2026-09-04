/**
 * Smoke: el mapa de especies no debe saltar a Castellón cuando la provincia
 * activa es otra; puntoEnRegionMapa debe discriminar Sevilla vs Castellón.
 *
 * Uso: node scripts/assert_camara_por_provincia.mjs
 */
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Reimplementación ligera (mismo criterio que geoService.puntoEnRegionMapa)
function puntoEnRegionMapa(lat, lng, region, margenRelativo = 0.2) {
  const halfLat = (region.latitudeDelta / 2) * (1 + margenRelativo);
  const halfLng = (region.longitudeDelta / 2) * (1 + margenRelativo);
  return (
    lat >= region.latitude - halfLat &&
    lat <= region.latitude + halfLat &&
    lng >= region.longitude - halfLng &&
    lng <= region.longitude + halfLng
  );
}

const sevilla = { latitude: 37.55, longitude: -5.85, latitudeDelta: 1.35, longitudeDelta: 1.35 };
const castellon = { latitude: 40.05, longitude: -0.02, latitudeDelta: 1.25, longitudeDelta: 1.25 };

let fallos = 0;
function fail(m) {
  console.error("FAIL:", m);
  fallos++;
}
function ok(m) {
  console.log("OK:", m);
}

// Punto en Grao de Castellón
const grao = { lat: 39.98, lng: 0.02 };
if (puntoEnRegionMapa(grao.lat, grao.lng, castellon)) ok("Grao dentro de Castellón");
else fail("Grao debería estar en Castellón");

if (!puntoEnRegionMapa(grao.lat, grao.lng, sevilla)) ok("Grao fuera de Sevilla");
else fail("Grao NO debe contar como Sevilla (evita salto de cámara)");

// Guadalquivir / Sevilla ciudad
const sevillaCentro = { lat: 37.39, lng: -5.99 };
if (puntoEnRegionMapa(sevillaCentro.lat, sevillaCentro.lng, sevilla)) ok("Sevilla ciudad dentro de Sevilla");
else fail("Sevilla ciudad debería estar en Sevilla");

if (!puntoEnRegionMapa(sevillaCentro.lat, sevillaCentro.lng, castellon)) ok("Sevilla ciudad fuera de Castellón");
else fail("Sevilla ciudad NO debe contar como Castellón");

const especiesSrc = readFileSync(join(root, "src/screens/EspeciesScreen.tsx"), "utf8");
if (/usarMiUbicacion\(\);\s*\n\s*\}, \[\]/.test(especiesSrc) || /useEffect\(\(\) => \{\s*usarMiUbicacion\(\);/.test(especiesSrc)) {
  fail("EspeciesScreen no debe volar al GPS en el mount (provoca salto a Castellón)");
} else {
  ok("EspeciesScreen no auto-vuela al GPS al montar");
}

if (!especiesSrc.includes("puntoEnRegionMapa")) {
  fail("EspeciesScreen debe filtrar GPS con puntoEnRegionMapa");
} else {
  ok("EspeciesScreen usa puntoEnRegionMapa");
}

if (!especiesSrc.includes("camaraProvincia") && !especiesSrc.includes("provincia.regionMapa")) {
  fail("EspeciesScreen debe anclar la cámara a regionMapa");
} else {
  ok("EspeciesScreen ancla cámara a la provincia");
}

if (
  !especiesSrc.includes("Catálogo · ${provincia.nombre}") &&
  !especiesSrc.includes("Catálogo ríos · ${provincia.nombre}") &&
  !especiesSrc.includes("Catálogo orilla · ${provincia.nombre}") &&
  !especiesSrc.includes("Catálogo · ")
) {
  fail("El catálogo debe titularse con el nombre de provincia");
} else {
  ok("Catálogo titulado por provincia");
}

if (fallos) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nTodo OK · cámara y especies ancladas por provincia.");
