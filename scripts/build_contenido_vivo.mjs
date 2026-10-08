/**
 * Genera packs de contenido vivo en public/content/ para sync OTA
 * (normativa meta, especies, zonas/tramos) sin publicar una app nueva.
 *
 * Uso: node scripts/build_contenido_vivo.mjs
 * Se invoca también desde build:web.
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
}

/** Extrae `export const NAME = { ... };` (objeto plano de strings). */
function readTsStringObject(rel, exportName) {
  const src = fs.readFileSync(path.join(root, rel), "utf8");
  const re = new RegExp(`export const ${exportName}\\s*=\\s*\\{([\\s\\S]*?)\\n\\};`, "m");
  const m = src.match(re);
  if (!m) throw new Error(`No se encontró export const ${exportName} en ${rel}`);
  const out = {};
  const reField = /(\w+)\s*:\s*"((?:\\.|[^"\\])*)"/g;
  let fm;
  while ((fm = reField.exec(m[1]))) {
    out[fm[1]] = fm[2].replace(/\\"/g, '"').replace(/\\n/g, "\n");
  }
  if (!out.titulo) throw new Error(`${exportName} en ${rel} sin titulo`);
  return out;
}

function aFuenteUi(raw) {
  return {
    titulo: raw.titulo,
    vigenciaNota: raw.vigenciaNota,
    urlOrden: raw.urlOrden || raw.urlNormativa || "",
    urlLicencia: raw.urlLicencia || "",
  };
}

const pkg = readJson("package.json");

const payload = {
  schema: 1,
  bundleMinVersion: pkg.version,
  costa: {
    especiesOrilla: readJson("src/data/especiesOrilla.json"),
    especiesEmbarcacion: readJson("src/data/especiesEmbarcacion.json"),
  },
  provincias: {
    castellon: {
      fuenteNormativa: aFuenteUi(readTsStringObject("src/data/normativa2026.ts", "FUENTE_NORMATIVA")),
      species: readJson("src/data/species.json"),
      zones: readJson("src/data/zones.json"),
      tramos: readJson("src/data/tramosOficiales.json"),
    },
    sevilla: {
      fuenteNormativa: aFuenteUi(
        readTsStringObject("src/provincias/sevilla/normativa.ts", "FUENTE_NORMATIVA_ANDALUCIA")
      ),
      zones: readJson("src/provincias/sevilla/zones.json"),
      tramos: readJson("src/provincias/sevilla/tramosOficiales.json"),
      speciesOverrides: readJson("src/provincias/sevilla/speciesOverrides.json"),
      speciesExtra: readJson("src/provincias/sevilla/speciesExtra.json"),
    },
    cordoba: {
      fuenteNormativa: aFuenteUi(
        readTsStringObject("src/provincias/cordoba/normativa.ts", "FUENTE_NORMATIVA_ANDALUCIA")
      ),
      zones: readJson("src/provincias/cordoba/zones.json"),
      tramos: readJson("src/provincias/cordoba/tramosOficiales.json"),
      speciesOverrides: readJson("src/provincias/cordoba/speciesOverrides.json"),
      speciesExtra: readJson("src/provincias/cordoba/speciesExtra.json"),
    },
    cuenca: {
      fuenteNormativa: aFuenteUi(
        readTsStringObject("src/provincias/cuenca/normativa.ts", "FUENTE_NORMATIVA_CLM")
      ),
      zones: readJson("src/provincias/cuenca/zones.json"),
      tramos: readJson("src/provincias/cuenca/tramosOficiales.json"),
      speciesOverrides: readJson("src/provincias/cuenca/speciesOverrides.json"),
      speciesExtra: readJson("src/provincias/cuenca/speciesExtra.json"),
    },
  },
};

// Hash estable: sin generatedAt (solo cambia si cambia el contenido útil).
const hash = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 12);
const pack = {
  ...payload,
  version: `${pkg.version}+${hash}`,
  generatedAt: new Date().toISOString(),
};
const packFinal = JSON.stringify(pack);

const outDir = path.join(root, "public", "content");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "pack.json"), packFinal);

const manifest = {
  schema: 1,
  version: pack.version,
  generatedAt: pack.generatedAt,
  pack: "pack.json",
  sha256Prefix: hash,
  notas:
    "Normativa meta, especies y zonas/tramos. Clima/SAIH/avisos se piden en vivo aparte.",
};

fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

console.log(
  `OK: contenido vivo ${manifest.version} → public/content/ (${Math.round(packFinal.length / 1024)} KB)`
);
