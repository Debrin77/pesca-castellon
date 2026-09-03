/**
 * Descarga polígonos oficiales DERA 08_10_CotosPesca (IECA / Junta, CC BY 4.0)
 * alineados con la Orden de 13 de enero de 2023 (BOJA 15/2023) y genera:
 *   src/provincias/sevilla/pescaOficial.json
 *   src/provincias/sevilla/tramosOficiales.json
 *   src/provincias/sevilla/zones.json
 *
 *   node scripts/build_sevilla_pesca_geojson.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DIR = path.join(ROOT, "src", "provincias", "sevilla");

const WFS = "https://www.ideandalucia.es/services/DERA_g8_tejido_economico/wfs";
const TYPE = "DERA_g8_tejido_economico:g08_10_CotosPesca";

function metrosPorGrado(lat) {
  return { x: 111320 * Math.cos((lat * Math.PI) / 180), y: 110540 };
}

function walk(coords, fn) {
  if (typeof coords[0] === "number") fn(coords[0], coords[1]);
  else coords.forEach((c) => walk(c, fn));
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

function centroide(geom) {
  let sx = 0,
    sy = 0,
    n = 0;
  walk(geom.coordinates, (x, y) => {
    sx += x;
    sy += y;
    n++;
  });
  return n ? { lng: sx / n, lat: sy / n } : { lng: 0, lat: 0 };
}

function anchoMinM(b) {
  const midLat = (b[1] + b[3]) / 2;
  const m = metrosPorGrado(midLat);
  return Math.min((b[2] - b[0]) * m.x, (b[3] - b[1]) * m.y);
}

function epsPara(anchoM) {
  if (anchoM < 250) return 0.000025;
  if (anchoM < 800) return 0.00006;
  if (anchoM < 4000) return 0.00014;
  return 0.00028;
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

function roundPt(p, dec = 5) {
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

function slug(nombre) {
  return String(nombre)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48);
}

function cuencaDe(nombre, municipios) {
  const t = `${nombre} ${municipios}`.toLowerCase();
  if (/huéznar|hueznar|san pedro|alan[ií]s|constantina/.test(t)) return "Rivera de Huelva";
  if (/minilla|cala|agrio|guadiamar|gergal|ronquillo|guillena/.test(t)) return "Rivera de Huelva";
  if (/pintado|melonares|viár|viar|cazalla|pedroso/.test(t)) return "Rivera de Huelva";
  if (/guadaíra|guadaira|alcalá de guadaíra/.test(t)) return "Guadaíra";
  if (/corbones|osuna|marchena|puebla de cazalla/.test(t)) return "Corbones";
  if (/torre|águila|aguila|santiago|salado|utrera|lebrija|morón|moron/.test(t)) return "Corbones";
  if (/doñana|entremuros|dehesa de abajo|puebla del r[ií]o|isla mayor/.test(t)) return "Guadalquivir";
  return "Guadalquivir";
}

function especiesDe(tipo, nombre) {
  if (/refugio/i.test(tipo)) return [];
  if (/barqueta|paseo de la o|chapina|alcalá del r[ií]o|alcala del rio/i.test(nombre)) {
    return ["carpa", "siluro", "alburno", "barbo_gitano", "carpin"];
  }
  return ["black_bass", "carpa", "barbo_gitano", "alburno", "carpin", "lucio"];
}

function radioDesdeBbox(b) {
  const midLat = (b[1] + b[3]) / 2;
  const m = metrosPorGrado(midLat);
  const w = (b[2] - b[0]) * m.x;
  const h = (b[3] - b[1]) * m.y;
  return Math.max(0.6, Math.min(8, (Math.max(w, h) / 1000) * 0.55));
}

async function fetchSevilla() {
  const url = new URL(WFS);
  url.searchParams.set("service", "WFS");
  url.searchParams.set("version", "1.1.0");
  url.searchParams.set("request", "GetFeature");
  url.searchParams.set("typeName", TYPE);
  url.searchParams.set("outputFormat", "application/json");
  url.searchParams.set("srsName", "EPSG:4326");
  url.searchParams.set("CQL_FILTER", "provincia LIKE '%Sevilla%'");
  const res = await fetch(url, { headers: { "User-Agent": "PescaCastellon/1.0" } });
  if (!res.ok) throw new Error(`WFS HTTP ${res.status}`);
  return res.json();
}

async function main() {
  console.log("WFS DERA g08_10_CotosPesca (Sevilla)…");
  const fc = await fetchSevilla();
  const raw = fc.features || [];
  console.log("features", raw.length);

  const features = [];
  const tramos = [];
  const zones = [];

  raw.forEach((ft, i) => {
    const p = ft.properties || {};
    const refugio = /refugio/i.test(p.tipo || "") || /^refugio/i.test(p.nombre || "");
    const capa = refugio ? "refugio" : "zpl";
    const b = bboxOf(ft.geometry);
    const anchoM = Math.round(anchoMinM(b));
    const estrecho = anchoM < 400;
    const geom = simplifyGeom(ft.geometry, epsPara(anchoM), estrecho ? 6 : 5);
    const c = centroide(geom);
    const idNum = String(p.id_dera ?? i);
    const sid = slug(p.nombre || `tramo_${i}`);
    const tramoId = `sev-${sid}`;
    const zoneId = sid.startsWith("refugio_") || sid.startsWith("embalse_") || sid.startsWith("tramos_")
      ? sid
      : refugio
        ? `refugio_${sid}`
        : `zona_${sid}`;

    features.push({
      type: "Feature",
      properties: {
        capa,
        id: idNum,
        nombre: p.nombre,
        matricula: null,
        masa: p.nombre,
        vocacion: refugio ? "Refugio de pesca (Anexo IV)" : "Aguas libres / ciprinícola",
        tramoId,
        estrecho,
        bufferM: estrecho ? 70 : 40,
        tipoDera: p.tipo,
        limiteSup: p.limite_sup,
        limiteInf: p.limite_inf,
        municipios: p.municipio,
        provincia: p.provincia,
      },
      geometry: geom,
    });

    const radioKm = Number((radioDesdeBbox(b)).toFixed(2));
    const munis = String(p.municipio || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const especies = especiesDe(p.tipo, p.nombre);
    const cuenca = cuencaDe(p.nombre, p.municipio || "");

    tramos.push({
      id: tramoId,
      codigo: `SE-${String(i + 1).padStart(2, "0")}`,
      nombre: p.nombre,
      rio: p.nombre,
      lat: Number(c.lat.toFixed(5)),
      lng: Number(c.lng.toFixed(5)),
      radioKm,
      vocacion: refugio ? "Refugio de pesca" : "Ciprinícola",
      regimen: refugio ? "No pescable" : "Recreo / aguas libres",
      aprovechamiento: refugio ? "VP" : "ZPL",
      notaAnexo: refugio ? "ANEXO_IV" : /barbos|rejones/i.test(p.tipo || "") ? "ANEXO_V_3" : null,
      fichaId: zoneId,
      especies,
      cuenca,
      municipios: munis,
    });

    zones.push({
      id: zoneId,
      nombre: p.nombre,
      tipo: /embalse/i.test(p.nombre) ? "embalse" : "rio",
      estadoZona: refugio ? "vedada" : "libre",
      vocacionOficial: refugio ? "Refugio de pesca (Anexo IV BOJA)" : "Aguas libres · ciprinícola",
      rio: p.nombre,
      municipio: munis[0] || "Sevilla",
      lat: Number(c.lat.toFixed(5)),
      lng: Number(c.lng.toFixed(5)),
      radioAproxKm: radioKm,
      descripcion: refugio
        ? `Refugio de pesca declarado en el Anexo IV de la Orden de 13 de enero de 2023 (BOJA nº 15). La pesca está prohibida con carácter permanente. Límites DERA: ${p.limite_sup || "—"} → ${p.limite_inf || "—"}.`
        : `Aguas libres (art. 5.2 de la Orden 13/01/2023): no es coto ni refugio. Cartografía DERA 08_10_CotosPesca (${p.tipo}). ${
            /barbos|rejones/i.test(p.tipo || "")
              ? "Anexo V.3: en competiciones oficiales FAPD se permite retener barbos en rejones durante su veda."
              : ""
          } Límites: ${p.limite_sup || "—"} → ${p.limite_inf || "—"}.`.trim(),
      especies,
      mejoresEpocas: refugio
        ? {}
        : {
            black_bass: ["marzo", "abril", "mayo", "octubre"],
            carpa: ["mayo", "junio", "septiembre"],
            barbo_gitano: ["julio", "agosto", "septiembre", "octubre"],
          },
      saihEstacion: null,
      saihNombre: null,
      saihFichaId: null,
      cuenca,
      fuenteOficial: "DERA 08_10_CotosPesca · Orden 13/01/2023 BOJA 15",
    });
  });

  const geo = {
    type: "FeatureCollection",
    name: "sevillaPescaOficial",
    attribution:
      "IECA / Junta de Andalucía · DERA 08_10_CotosPesca · CC BY 4.0. Orden de 13 de enero de 2023 (BOJA nº 15).",
    generated: new Date().toISOString().slice(0, 10),
    features,
  };

  fs.writeFileSync(path.join(DIR, "pescaOficial.json"), JSON.stringify(geo));
  fs.writeFileSync(path.join(DIR, "tramosOficiales.json"), JSON.stringify(tramos, null, 2) + "\n");
  fs.writeFileSync(path.join(DIR, "zones.json"), JSON.stringify(zones, null, 2) + "\n");

  const kb = Math.round(fs.statSync(path.join(DIR, "pescaOficial.json")).size / 1024);
  const nRef = features.filter((f) => f.properties.capa === "refugio").length;
  const nZpl = features.filter((f) => f.properties.capa === "zpl").length;
  console.log(`OK ${features.length} polígonos (${nRef} refugios, ${nZpl} aguas libres) → pescaOficial.json (${kb} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
