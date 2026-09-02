/**
 * Descarga polígonos oficiales ICV (WFS) y deja un GeoJSON ligero de Castellón.
 * QGIS no es la fuente: sirve para revisar/editar este archivo si hace falta.
 *
 *   node scripts/build_icv_geojson.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "src", "data", "icvPescaCastellon.json");
const TRAMOS = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "data", "tramosOficiales.json"), "utf8"));

const WFS = "https://terramapas.icv.gva.es/0504_CazaPesca";
const LAYERS = [
  { typeName: "Pesca.ZonasControladas", capa: "zpc" },
  { typeName: "Pesca.ZonasReserva.TruchaComun", capa: "reserva" },
  { typeName: "Pesca.ZonasReserva.Anguila", capa: "reserva" },
];

const CS = { minLng: -0.92, minLat: 39.66, maxLng: 0.52, maxLat: 40.82 };

function metrosPorGrado(lat) {
  return { x: 111320 * Math.cos((lat * Math.PI) / 180), y: 110540 };
}

function anchoMinM(b) {
  const midLat = (b[1] + b[3]) / 2;
  const m = metrosPorGrado(midLat);
  return Math.min((b[2] - b[0]) * m.x, (b[3] - b[1]) * m.y);
}

function epsPara(anchoM) {
  if (anchoM < 250) return 0.000025; // ~3 m: no aplastar cauces
  if (anchoM < 800) return 0.00006;
  return 0.00014;
}

function bboxOf(geom) {
  let minx = 180,
    miny = 90,
    maxx = -180,
    maxy = -90;
  walk(geom.coordinates, (x, y) => {
    minx = Math.min(minx, x);
    maxx = Math.max(maxx, x);
    miny = Math.min(miny, y);
    maxy = Math.max(maxy, y);
  });
  return [minx, miny, maxx, maxy];
}

function walk(coords, fn) {
  if (typeof coords[0] === "number") fn(coords[0], coords[1]);
  else coords.forEach((c) => walk(c, fn));
}

function intersectsCs(b) {
  return b[2] >= CS.minLng && b[0] <= CS.maxLng && b[3] >= CS.minLat && b[1] <= CS.maxLat;
}

function distToSeg(p, a, b) {
  const x = p[0],
    y = p[1],
    x1 = a[0],
    y1 = a[1],
    x2 = b[0],
    y2 = b[1];
  const dx = x2 - x1,
    dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
  let t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

function simplifyRing(pts, eps) {
  if (pts.length < 4) return pts;
  const keep = new Array(pts.length).fill(false);
  keep[0] = true;
  keep[pts.length - 1] = true;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop();
    let maxD = -1,
      maxK = -1;
    for (let k = i + 1; k < j; k++) {
      const d = distToSeg(pts[k], pts[i], pts[j]);
      if (d > maxD) {
        maxD = d;
        maxK = k;
      }
    }
    if (maxD > eps && maxK >= 0) {
      keep[maxK] = true;
      stack.push([i, maxK], [maxK, j]);
    }
  }
  const out = pts.filter((_, i) => keep[i]);
  return out.length >= 4 ? out : pts;
}

function roundPt(p, dec = 6) {
  const f = 10 ** dec;
  return [Math.round(p[0] * f) / f, Math.round(p[1] * f) / f];
}

function anilloValido(r) {
  const uniq = new Set(r.map((p) => p.join(",")));
  return r.length >= 4 && uniq.size >= 3;
}

function simplifyGeom(geom, eps, dec) {
  const ring = (r) => simplifyRing(r, eps).map((p) => roundPt(p, dec));
  if (geom.type === "Polygon") {
    const coords = geom.coordinates.map(ring).filter(anilloValido);
    return { type: "Polygon", coordinates: coords.length ? coords : geom.coordinates.map((r) => r.map((p) => roundPt(p, dec))) };
  }
  if (geom.type === "MultiPolygon") {
    const coordinates = geom.coordinates
      .map((poly) => poly.map(ring).filter(anilloValido))
      .filter((poly) => poly.length);
    return {
      type: "MultiPolygon",
      coordinates: coordinates.length ? coordinates : geom.coordinates.map((poly) => poly.map((r) => r.map((p) => roundPt(p, dec)))),
    };
  }
  return geom;
}

function capaDe(props, fallback) {
  if (fallback === "zpc" || props.matricula) return "zpc";
  const sp = String(props.especie || "").toLowerCase();
  if (sp.includes("trucha")) return "zrtc";
  if (sp.includes("anguila")) return "zra";
  return "zrtc";
}

function nombreDe(props, capa) {
  if (capa === "zpc") return `${props.matricula} · ${props.denominacion}`;
  return `${props.denom_zona_reserva} (${props.especie})`;
}

function matchTramo(capa, props) {
  if (capa === "zpc") {
    const m = String(props.matricula || "").toUpperCase();
    return TRAMOS.find((t) => String(t.matriculaCoto || "").toUpperCase() === m)?.id ?? null;
  }
  const nom = String(props.denom_zona_reserva || "").toLowerCase();
  if (capa === "zrtc") {
    return (
      TRAMOS.find((t) => t.aprovechamiento === "ZRTC" && nom.includes(t.rio.replace("Río ", "").toLowerCase()))?.id ??
      null
    );
  }
  return null;
}

async function fetchLayer(typeName) {
  const url = new URL(WFS);
  url.searchParams.set("service", "WFS");
  url.searchParams.set("version", "2.0.0");
  url.searchParams.set("request", "GetFeature");
  url.searchParams.set("typename", typeName);
  url.searchParams.set("outputformat", "application/json; subtype=geojson");
  url.searchParams.set("srsName", "EPSG:4326");
  const res = await fetch(url, { headers: { "User-Agent": "PescaCastellon/1.0" } });
  if (!res.ok) throw new Error(`${typeName} HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const seen = new Set();
  const features = [];
  for (const layer of LAYERS) {
    console.log("WFS", layer.typeName);
    const fc = await fetchLayer(layer.typeName);
    for (const ft of fc.features || []) {
      const b = bboxOf(ft.geometry);
      if (!intersectsCs(b)) continue;
      const capa = capaDe(ft.properties || {}, layer.capa);
      const key = `${capa}|${ft.properties?.id}|${ft.properties?.matricula || ft.properties?.denom_zona_reserva}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const propsIn = ft.properties || {};
      if (capa === "zpc" && !String(propsIn.matricula || "").startsWith("CS")) continue;
      const anchoM = Math.round(anchoMinM(b));
      const areaHa = Number(propsIn.area_ha);
      const estrecho =
        capa === "zrtc" ||
        anchoM < 320 ||
        (Number.isFinite(areaHa) && areaHa > 0 && areaHa < 12);
      const bufferM = estrecho ? 70 : 40;
      features.push({
        type: "Feature",
        properties: {
          capa,
          id: String(propsIn.id ?? key),
          nombre: nombreDe(propsIn, capa),
          matricula: propsIn.matricula || null,
          masa: propsIn.masa || propsIn.denom_zona_reserva || null,
          vocacion: propsIn.vocacion || null,
          tramoId: matchTramo(capa, propsIn),
          estrecho,
          bufferM,
        },
        geometry: simplifyGeom(ft.geometry, epsPara(anchoM), estrecho ? 6 : 5),
      });
    }
  }
  const out = {
    type: "FeatureCollection",
    name: "icvPescaCastellon",
    attribution: "ICV / GVA · CC BY 4.0 · WFS 0504_CazaPesca",
    generated: new Date().toISOString().slice(0, 10),
    features,
  };
  fs.writeFileSync(OUT, JSON.stringify(out));
  const kb = Math.round(fs.statSync(OUT).size / 1024);
  console.log(`OK ${features.length} polígonos → ${path.relative(ROOT, OUT)} (${kb} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
