/**
 * Assert: módulos de features expertas presentes (batimetría/radar/solunar/GPX/PescaREC/…).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const required = [
  "src/services/solunarService.ts",
  "src/services/tideService.ts",
  "src/services/radarService.ts",
  "src/services/gpxService.ts",
  "src/services/fishIdService.ts",
  "src/services/pescaRecService.ts",
  "src/services/trackService.ts",
  "src/services/offlineMapService.ts",
  "src/services/cupoService.ts",
  "src/data/concursos.ts",
  "src/data/permisosCoto.ts",
  "src/data/modalidades.ts",
  "src/components/PescaRecBanner.tsx",
  "src/components/VentanasSolunarMarea.tsx",
  "src/components/CalendarioConcursos.tsx",
  "src/components/IdentificarEspecie.tsx",
  "src/components/PanelOfflineMapa.tsx",
  "src/components/SelectorModalidad.tsx",
];

let fallos = 0;
for (const rel of required) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    console.error(`FAIL missing ${rel}`);
    fallos++;
  }
}

const consulta = fs.readFileSync(path.join(root, "src/services/consultaPescaService.ts"), "utf8");
if (!consulta.includes("fuenteNormativaDetalle")) {
  console.error("FAIL ConsultaPesca sin fuenteNormativaDetalle");
  fallos++;
}

const mapWeb = fs.readFileSync(path.join(root, "src/components/map/index.web.tsx"), "utf8");
if (!mapWeb.includes("showRadar") || !mapWeb.includes("Polyline")) {
  console.error("FAIL mapa web sin radar/Polyline");
  fallos++;
}

const card = fs.readFileSync(path.join(root, "src/components/ConsultaPescaCard.tsx"), "utf8");
if (!card.includes("PescaRecBanner") || !card.includes("consultadoEn")) {
  console.error("FAIL ConsultaPescaCard sin PescaREC / fecha normativa");
  fallos++;
}

if (fallos) {
  console.error(`assert_features_expertas: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_features_expertas");
