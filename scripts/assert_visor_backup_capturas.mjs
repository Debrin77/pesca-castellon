/**
 * Assert: visor de foto con zoom + copia de seguridad / export CSV de capturas.
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
function ok(m) {
  console.log("OK", m);
}
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const visorPath = path.join(root, "src/components/VisorFotoCaptura.tsx");
if (!fs.existsSync(visorPath)) {
  fail("falta VisorFotoCaptura.tsx");
} else {
  const v = read("src/components/VisorFotoCaptura.tsx");
  if (!v.includes("maximumZoomScale") && !v.includes("onAjustarZoom")) {
    fail("VisorFotoCaptura debe permitir zoom");
  } else {
    ok("VisorFotoCaptura con zoom");
  }
  if (!v.includes("Modal") && !v.includes("createPortal")) fail("VisorFotoCaptura sin Modal/portal");
  else ok("VisorFotoCaptura Modal/portal");
  if (!v.includes("createPortal") && !v.includes("position") ) {
    /* optional */
  }
  if (v.includes("createPortal")) ok("VisorFotoCaptura portal web");
}

const backupPath = path.join(root, "src/services/backupCapturasService.ts");
if (!fs.existsSync(backupPath)) {
  fail("falta backupCapturasService.ts");
} else {
  const b = read("src/services/backupCapturasService.ts");
  if (!b.includes("exportarCopiaSeguridadCapturas") || !b.includes("exportarCapturasCsv")) {
    fail("backupCapturasService sin export JSON/CSV");
  } else {
    ok("backupCapturasService exporta JSON y CSV");
  }
  if (!b.includes("fotoUri") && !b.includes("capturas")) {
    fail("backup debe incluir capturas");
  } else {
    ok("backup incluye capturas");
  }
  if (!b.includes("writeAsStringAsync") && !b.includes("descargarWeb")) {
    fail("backup debe guardar/descargar archivo");
  } else {
    ok("backup escribe/descarga archivo");
  }
}

const catches = read("src/screens/MyCatchesScreen.tsx");
if (!catches.includes("VisorFotoCaptura") || !catches.includes("setVisorFoto")) {
  fail("MyCatchesScreen debe abrir VisorFotoCaptura");
} else {
  ok("MyCatchesScreen usa visor de foto");
}
if (!catches.includes("exportarCopiaSeguridadCapturas") || !catches.includes("exportarCapturasCsv")) {
  fail("MyCatchesScreen debe ofrecer copia de seguridad y CSV");
} else {
  ok("MyCatchesScreen copia de seguridad y CSV");
}
if (!catches.includes("Copia de seguridad · Capturas")) {
  fail("falta botón visible de copia de seguridad");
} else {
  ok("botón copia de seguridad visible");
}
if (
  !catches.includes("Ver foto completa") &&
  !catches.includes("pantalla completa con zoom")
) {
  fail("falta CTA para abrir visor desde la foto");
} else {
  ok("CTA abrir visor desde foto");
}
const preview = read("src/components/FotoPreviewCaptura.tsx");
if (!preview.includes("pointerEvents") || !preview.includes("onPress")) {
  fail("FotoPreviewCaptura debe soportar onPress (img pointerEvents none en web)");
} else {
  ok("FotoPreviewCaptura onPress web-safe");
}

const pkg = read("package.json");
if (!pkg.includes("assert_visor_backup_capturas.mjs")) {
  fail("assert_visor_backup_capturas no está en package.json assert");
} else {
  ok("assert en package.json");
}

if (fallos) {
  console.error(`FAIL assert_visor_backup_capturas (${fallos})`);
  process.exit(1);
}
console.log("OK assert_visor_backup_capturas");
