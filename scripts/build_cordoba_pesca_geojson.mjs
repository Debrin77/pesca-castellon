/**
 * Descarga polígonos oficiales DERA 08_10_CotosPesca (IECA / Junta, CC BY 4.0)
 * alineados con la Orden de 13 de enero de 2023 (BOJA 15/2023) y genera:
 *   src/provincias/cordoba/pescaOficial.json
 *   src/provincias/cordoba/tramosOficiales.json
 *   src/provincias/cordoba/zones.json
 *
 *   node scripts/build_cordoba_pesca_geojson.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DIR = path.join(ROOT, "src", "provincias", "cordoba");

const WFS = "https://www.ideandalucia.es/services/DERA_g8_tejido_economico/wfs";
const TYPE = "DERA_g8_tejido_economico:g08_10_CotosPesca";

/** SAIH CHG · página EmbalCO (Córdoba). */
const SAIH_CO = {
  embalse_de_iznajar: { nombre: "E05 Iznájar", url: "https://www.chguadalquivir.es/saih/EmbalCO.aspx" },
  embalse_de_la_brena_brena_ii: { nombre: "E50 Breña II", url: "https://www.chguadalquivir.es/saih/EmbalCO.aspx" },
  embalse_de_sierra_boyera: { nombre: "E47 Sierra Boyera", url: "https://www.chguadalquivir.es/saih/EmbalCO.aspx" },
  embalse_de_vadomojon: { nombre: "E53 Vadomojón", url: "https://www.chguadalquivir.es/saih/EmbalCO.aspx" },
  embalse_de_puente_nuevo: { nombre: "E48 Puente Nuevo", url: "https://www.chguadalquivir.es/saih/EmbalCO.aspx" },
  embalse_de_san_rafael_de_navallana: { nombre: "E51 Navallana", url: "https://www.chguadalquivir.es/saih/EmbalCO.aspx" },
  embalse_de_yeguas: { nombre: "E52 Yeguas", url: "https://www.chguadalquivir.es/saih/EmbalCO.aspx" },
  embalse_del_retortillo: { nombre: "E39 Retortillo", url: "https://www.chguadalquivir.es/saih/EmbalCO.aspx" },
  embalse_guadalmellato: { nombre: "E49 Guadalmellato", url: "https://www.chguadalquivir.es/saih/EmbalCO.aspx" },
  embalse_arenoso: { nombre: "E46 Arenoso", url: "https://www.chguadalquivir.es/saih/EmbalCO.aspx" },
};

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

function normNombre(n) {
  return String(n || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function prioridadTipo(tipo, nombre) {
  if (/refugio/i.test(tipo || "") || /^refugio/i.test(nombre || "")) return 0;
  if (/retenci[oó]n|barbos|rejones/i.test(tipo || "")) return 1;
  if (/mejill[oó]n|siluro|medidas/i.test(tipo || "")) return 2;
  return 3;
}

function cuencaDe(nombre, municipios) {
  const t = `${nombre} ${municipios}`.toLowerCase();
  if (/izn[aá]jar|genil|cordobilla|malpasillo|tiscar|yeg[uü]as|vadomoj[oó]n/i.test(t)) return "Genil";
  if (/guadiato|bre[nñ]a|puente nuevo|sierra boyera|bemb[eé]zar/i.test(t)) return "Guadiato";
  if (/guadajoz|baena|luque|jarales|zo[nñ]ar|rincon|amarga|conde/i.test(t)) return "Guadajoz";
  if (/navallana|guadalmellato|arenoso|mart[ií]n gonzalo|montoro|c[oó]rdoba/i.test(t)) return "Guadalquivir";
  if (/retortillo|hornachuelos/i.test(t)) return "Guadalquivir";
  return "Guadalquivir";
}

function especiesDe(tipo, nombre) {
  if (/refugio/i.test(tipo) || /^refugio/i.test(nombre || "")) return [];
  if (/siluro/i.test(tipo || "")) {
    return ["carpa", "black_bass", "barbo_gitano", "alburno", "carpin", "lucio"];
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

function descripcionExtra(tipos) {
  const bits = [];
  if (tipos.some((t) => /siluro/i.test(t))) {
    bits.push("Medidas excepcionales siluro (DERA): la pesca del siluro como objetivo está prohibida; captura fortuita → sacrificio.");
  }
  if (tipos.some((t) => /mejill/i.test(t))) {
    bits.push("Medidas excepcionales mejillón cebra (DERA): desinfecta y seca el material al cambiar de masa.");
  }
  if (tipos.some((t) => /barbos|rejones/i.test(t))) {
    bits.push("Anexo V.3: en competiciones oficiales FAPD se permite retener barbos en rejones durante su veda.");
  }
  return bits;
}

function saihPara(zoneId) {
  // Quitar prefijo refugio_ si la masa libre comparte slug base
  const keys = Object.keys(SAIH_CO);
  for (const k of keys) {
    if (zoneId === k || zoneId.endsWith(k) || zoneId.includes(k)) return SAIH_CO[k];
  }
  // Retortillo refugio no lleva SAIH de pesca (vedado); el vaso libre sí
  if (zoneId.includes("retortillo") && !zoneId.startsWith("refugio")) return SAIH_CO.embalse_del_retortillo;
  if (zoneId.includes("navallana") && !zoneId.startsWith("refugio")) return SAIH_CO.embalse_de_san_rafael_de_navallana;
  if (zoneId.includes("iznajar")) return SAIH_CO.embalse_de_iznajar;
  if (zoneId.includes("brena")) return SAIH_CO.embalse_de_la_brena_brena_ii;
  if (zoneId.includes("sierra_boyera")) return SAIH_CO.embalse_de_sierra_boyera;
  if (zoneId.includes("vadomojon")) return SAIH_CO.embalse_de_vadomojon;
  if (zoneId.includes("puente_nuevo")) return SAIH_CO.embalse_de_puente_nuevo;
  if (zoneId.includes("yeguas")) return SAIH_CO.embalse_de_yeguas;
  if (zoneId.includes("guadalmellato")) return SAIH_CO.embalse_guadalmellato;
  if (zoneId.includes("arenoso")) return SAIH_CO.embalse_arenoso;
  return null;
}

async function fetchCordoba() {
  const url = new URL(WFS);
  url.searchParams.set("service", "WFS");
  url.searchParams.set("version", "1.1.0");
  url.searchParams.set("request", "GetFeature");
  url.searchParams.set("typeName", TYPE);
  url.searchParams.set("outputFormat", "application/json");
  url.searchParams.set("srsName", "EPSG:4326");
  url.searchParams.set("CQL_FILTER", "provincia LIKE '%Córdoba%'");
  const res = await fetch(url, { headers: { "User-Agent": "PescaCastellon/1.0" } });
  if (!res.ok) throw new Error(`WFS HTTP ${res.status}`);
  return res.json();
}

/** Agrupa duplicados DERA del mismo nombre (p. ej. Iznájar siluro + mejillón). */
function dedupeFeatures(raw) {
  const groups = new Map();
  for (const ft of raw) {
    const p = ft.properties || {};
    const key = normNombre(p.nombre);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(ft);
  }
  const out = [];
  for (const list of groups.values()) {
    list.sort(
      (a, b) =>
        prioridadTipo(a.properties?.tipo, a.properties?.nombre) -
        prioridadTipo(b.properties?.tipo, b.properties?.nombre)
    );
    const best = list[0];
    const tipos = [...new Set(list.map((f) => f.properties?.tipo).filter(Boolean))];
    best._tiposCombinados = tipos;
    // Geometría: la de mayor bbox (más representativa del vaso)
    let bestGeom = best;
    let bestArea = 0;
    for (const f of list) {
      const b = bboxOf(f.geometry);
      const area = Math.abs((b[2] - b[0]) * (b[3] - b[1]));
      if (area > bestArea) {
        bestArea = area;
        bestGeom = f;
      }
    }
    best.geometry = bestGeom.geometry;
    out.push(best);
  }
  return out;
}

async function main() {
  console.log("WFS DERA g08_10_CotosPesca (Córdoba)…");
  const fc = await fetchCordoba();
  const raw = fc.features || [];
  console.log("features raw", raw.length);
  const deduped = dedupeFeatures(raw);
  console.log("features tras dedupe", deduped.length);

  const features = [];
  const tramos = [];
  const zones = [];
  const usedSlugs = new Set();

  deduped.forEach((ft, i) => {
    const p = ft.properties || {};
    const tipos = ft._tiposCombinados || [p.tipo].filter(Boolean);
    const refugio = tipos.some((t) => /refugio/i.test(t)) || /^refugio/i.test(p.nombre || "");
    const capa = refugio ? "refugio" : "zpl";
    const b = bboxOf(ft.geometry);
    const anchoM = Math.round(anchoMinM(b));
    const estrecho = anchoM < 400;
    const geom = simplifyGeom(ft.geometry, epsPara(anchoM), estrecho ? 6 : 5);
    const c = centroide(geom);
    const idNum = String(p.id_dera ?? i);
    let sid = slug(p.nombre || `tramo_${i}`);
    if (usedSlugs.has(sid)) sid = `${sid}_${i}`;
    usedSlugs.add(sid);
    const tramoId = `cor-${sid}`;
    const zoneId = sid.startsWith("refugio_") || sid.startsWith("embalse_") || sid.startsWith("tramos_") || sid.startsWith("rio_")
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
        tipoDera: tipos.join(" · "),
        limiteSup: p.limite_sup,
        limiteInf: p.limite_inf,
        municipios: p.municipio,
        provincia: p.provincia,
      },
      geometry: geom,
    });

    const radioKm = Number(radioDesdeBbox(b).toFixed(2));
    const munis = String(p.municipio || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const especies = especiesDe(tipos.join(" "), p.nombre);
    const cuenca = cuencaDe(p.nombre, p.municipio || "");
    const extras = descripcionExtra(tipos);
    const saih = refugio ? null : saihPara(zoneId);

    tramos.push({
      id: tramoId,
      codigo: `CO-${String(i + 1).padStart(2, "0")}`,
      nombre: p.nombre,
      rio: p.nombre,
      lat: Number(c.lat.toFixed(5)),
      lng: Number(c.lng.toFixed(5)),
      radioKm,
      vocacion: refugio ? "Refugio de pesca" : "Ciprinícola",
      regimen: refugio ? "No pescable" : "Recreo / aguas libres",
      aprovechamiento: refugio ? "VP" : "ZPL",
      notaAnexo: refugio ? "ANEXO_IV" : tipos.some((t) => /barbos|rejones/i.test(t)) ? "ANEXO_V_3" : null,
      fichaId: zoneId,
      especies,
      cuenca,
      municipios: munis,
    });

    const zone = {
      id: zoneId,
      nombre: p.nombre,
      tipo: /embalse|pantano/i.test(p.nombre) ? "embalse" : "rio",
      estadoZona: refugio ? "vedada" : "libre",
      vocacionOficial: refugio ? "Refugio de pesca (Anexo IV BOJA)" : "Aguas libres · ciprinícola",
      rio: p.nombre,
      municipio: munis[0] || "Córdoba",
      lat: Number(c.lat.toFixed(5)),
      lng: Number(c.lng.toFixed(5)),
      radioAproxKm: radioKm,
      descripcion: refugio
        ? `Refugio de pesca declarado en el Anexo IV de la Orden de 13 de enero de 2023 (BOJA nº 15). La pesca está prohibida con carácter permanente. Límites DERA: ${p.limite_sup || "—"} → ${p.limite_inf || "—"}.`
        : `Aguas libres (art. 5.2 de la Orden 13/01/2023): no es coto ni refugio. Cartografía DERA 08_10_CotosPesca (${tipos.join(" · ")}). ${extras.join(" ")} Límites: ${p.limite_sup || "—"} → ${p.limite_inf || "—"}.`.trim(),
      avisos: extras,
      especies,
      mejoresEpocas: refugio
        ? {}
        : {
            black_bass: ["marzo", "abril", "mayo", "octubre"],
            carpa: ["mayo", "junio", "septiembre"],
            barbo_gitano: ["julio", "agosto", "septiembre", "octubre"],
          },
      saihEstacion: null,
      saihNombre: saih?.nombre ?? null,
      saihFichaId: null,
      saihFuente: saih ? "chg" : null,
      saihUrl: saih?.url ?? null,
      cuenca,
      fuenteOficial: "DERA 08_10_CotosPesca · Orden 13/01/2023 BOJA 15",
    };
    zones.push(zone);
  });

  const geo = {
    type: "FeatureCollection",
    name: "cordobaPescaOficial",
    attribution:
      "IECA / Junta de Andalucía · DERA 08_10_CotosPesca · CC BY 4.0. Orden de 13 de enero de 2023 (BOJA nº 15).",
    generated: new Date().toISOString().slice(0, 10),
    features,
  };

  const extraPath = path.join(DIR, "aguasLibresExtra.json");
  const extras = JSON.parse(fs.readFileSync(extraPath, "utf8"));
  let codigo = tramos.length;
  for (const e of extras) {
    codigo += 1;
    const tramoId = `cor-${e.id}`;
    if (tramos.some((t) => t.id === tramoId || t.fichaId === e.id)) continue;
    const saih = saihPara(e.id);
    tramos.push({
      id: tramoId,
      codigo: `CO-${String(codigo).padStart(2, "0")}`,
      nombre: e.nombre,
      rio: e.rio || e.nombre,
      lat: e.lat,
      lng: e.lng,
      radioKm: e.radioKm,
      vocacion: e.tipo === "embalse" ? "Ciprinícola / embalse" : "Ciprinícola",
      regimen: "Recreo / aguas libres (art. 5.2)",
      aprovechamiento: "ZPL",
      notaAnexo: e.notaAnexo || "ART_52_APROX",
      fichaId: e.id,
      especies: e.especies || [],
      cuenca: e.cuenca,
      municipios: e.municipios || [e.municipio],
    });
    zones.push({
      id: e.id,
      nombre: e.nombre,
      tipo: e.tipo || "rio",
      estadoZona: "libre",
      vocacionOficial: e.vocacionOficial || "Aguas libres · art. 5.2",
      rio: e.rio || e.nombre,
      municipio: e.municipio,
      lat: e.lat,
      lng: e.lng,
      radioAproxKm: e.radioKm,
      descripcion: e.descripcion,
      avisos: e.avisos || [],
      especies: e.especies || [],
      mejoresEpocas: {
        black_bass: ["marzo", "abril", "mayo", "octubre"],
        carpa: ["mayo", "junio", "septiembre"],
        barbo_gitano: ["julio", "agosto", "septiembre", "octubre"],
      },
      saihEstacion: null,
      saihNombre: saih?.nombre ?? null,
      saihFichaId: null,
      saihFuente: saih ? "chg" : null,
      saihUrl: saih?.url ?? null,
      cuenca: e.cuenca,
      fuenteOficial: "Art. 5.2 Orden 13/01/2023 · radio orientativo (sin polígono DERA)",
    });
  }

  fs.writeFileSync(path.join(DIR, "pescaOficial.json"), JSON.stringify(geo));
  fs.writeFileSync(path.join(DIR, "tramosOficiales.json"), JSON.stringify(tramos, null, 2) + "\n");
  fs.writeFileSync(path.join(DIR, "zones.json"), JSON.stringify(zones, null, 2) + "\n");

  const kb = Math.round(fs.statSync(path.join(DIR, "pescaOficial.json")).size / 1024);
  const nRef = features.filter((f) => f.properties.capa === "refugio").length;
  const nZpl = features.filter((f) => f.properties.capa === "zpl").length;
  console.log(
    `OK ${features.length} polígonos DERA (${nRef} refugios, ${nZpl} ZPL) + ${extras.length} aguas libres art. 5.2 → ${tramos.length} tramos (${kb} KB polígonos)`
  );
  console.log(
    "tramos:",
    tramos.map((t) => t.id).join(", ")
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
