/**
 * Assert: fotos de capturas persistentes + picker web fiable (label/input).
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

const svcPath = path.join(root, "src/services/fotoCapturaService.ts");
if (!fs.existsSync(svcPath)) {
  fail("falta src/services/fotoCapturaService.ts");
} else {
  const svc = read("src/services/fotoCapturaService.ts");
  if (!svc.includes("persistirFotoCaptura") || !svc.includes("fotoDesdeAsset")) {
    fail("fotoCapturaService sin persistirFotoCaptura / fotoDesdeAsset");
  } else {
    ok("fotoCapturaService exporta persistencia");
  }
  if (!svc.includes("data:image/") || !svc.includes("base64")) {
    fail("fotoCapturaService debe convertir a data URI base64");
  } else {
    ok("fotoCapturaService usa data URI");
  }
  if (!svc.includes("elegirFotoWebSync") || !svc.includes("input.click()")) {
    fail("fotoCapturaService debe abrir el file picker con click() síncrono");
  } else {
    ok("picker web síncrono (FAB)");
  }
  if (!svc.includes("fotoDesdeFile")) {
    fail("fotoCapturaService sin fotoDesdeFile");
  } else {
    ok("fotoDesdeFile");
  }
}

const btnPath = path.join(root, "src/components/BotonFotoCaptura.tsx");
if (!fs.existsSync(btnPath)) {
  fail("falta BotonFotoCaptura.tsx");
} else {
  const btn = read("src/components/BotonFotoCaptura.tsx");
  if (!btn.includes('type: "file"') || !btn.includes('"label"')) {
    fail("BotonFotoCaptura web debe usar label + input type=file");
  } else {
    ok("BotonFotoCaptura con label/input (Safari/PWA)");
  }
  if (/style:\s*\{\s*display:\s*["']none["']/.test(btn) || /display:\s*["']none["']/.test(btn.replace(/\/\/.*/g, ""))) {
    fail("BotonFotoCaptura no debe usar display none en el input (Safari)");
  } else if (!btn.includes("opacity: 0.01")) {
    fail("BotonFotoCaptura web debe usar opacity en el input file");
  } else {
    ok("input file visible para Safari (opacity)");
  }
}

const catches = read("src/screens/MyCatchesScreen.tsx");
if (!catches.includes("fotoDesdeAsset") || !catches.includes("persistirFotoCaptura")) {
  fail("MyCatchesScreen debe usar fotoDesdeAsset / persistirFotoCaptura");
} else {
  ok("MyCatchesScreen persiste fotos al elegir/guardar");
}
if (!catches.includes("BotonFotoCaptura")) {
  fail("Capturas debe usar BotonFotoCaptura (gesto web fiable)");
} else {
  ok("usa BotonFotoCaptura");
}
if (!catches.includes('import * as ImagePicker from "expo-image-picker"')) {
  fail("ImagePicker debe importarse estático");
} else {
  ok("ImagePicker import estático");
}
if (/await import\(["']expo-image-picker["']\)/.test(catches)) {
  fail("No usar dynamic import de expo-image-picker en el handler del botón");
} else {
  ok("sin dynamic import de image-picker");
}
if (!catches.includes("esNombrePuntoFechaPorDefecto") && !catches.includes("esNombrePuntoSoloFecha")) {
  fail("Al enlazar sitio guardado no debe volcar fecha en Lugar");
} else {
  ok("Lugar no recibe nombre-fecha por defecto del punto");
}
if (!catches.includes("nombreSitioDesdeCoords") && !catches.includes("nombreLugarDesdeMapa")) {
  fail("Lugar debe rellenarse con el nombre del mapa (no la fecha del chip)");
} else {
  ok("Lugar desde mapa al elegir punto");
}
if (!catches.includes("FotoPreviewCaptura")) {
  fail("Capturas debe usar FotoPreviewCaptura (preview web sin icono rojo)");
} else {
  ok("FotoPreviewCaptura");
}
if (!catches.includes("nombreParaPuntoGuardado")) {
  fail("Al guardar punto desde Capturas no debe usarse fecha como nombre");
} else {
  ok("guardar punto con nombre de mapa");
}

const nombreMapa = path.join(root, "src/services/nombreSitioMapaService.ts");
if (!fs.existsSync(nombreMapa)) {
  fail("falta nombreSitioMapaService.ts");
} else {
  const nm = read("src/services/nombreSitioMapaService.ts");
  if (!nm.includes("nombreParaPuntoGuardado") || nm.includes("toLocaleDateString")) {
    fail("nombreSitioMapaService no debe usar fecha como nombre de punto");
  } else {
    ok("nombreSitioMapaService sin fecha");
  }
}

const sheet = read("src/components/GuardarPuntoSheet.tsx");
if (!sheet.includes("nombreParaPuntoGuardado") || /Punto del \$\{/.test(sheet)) {
  fail("GuardarPuntoSheet debe guardar nombre del mapa, no fecha");
} else {
  ok("GuardarPuntoSheet nombre del mapa");
}

const preview = path.join(root, "src/components/FotoPreviewCaptura.tsx");
if (!fs.existsSync(preview)) {
  fail("falta FotoPreviewCaptura.tsx");
} else {
  const pv = read("src/components/FotoPreviewCaptura.tsx");
  if (!pv.includes("createObjectURL") || !pv.includes('"img"')) {
    fail("FotoPreviewCaptura web debe usar img + blob URL");
  } else {
    ok("FotoPreviewCaptura blob URL");
  }
}
if (!catches.includes("actualizarPunto")) {
  fail("Al elegir sitio debe poder editar/guardar el nombre del punto");
} else {
  ok("nombre del sitio editable al enlazar punto");
}
if (!catches.includes("AAAA/MM/DD") || !catches.includes("normalizarFechaCapturaAIso")) {
  fail("Fecha de captura debe usar formato AAAA/MM/DD");
} else {
  ok("fecha captura AAAA/MM/DD");
}
if (!catches.includes("base64: true")) {
  fail("ImagePicker nativo debe pedir base64: true");
} else {
  ok("ImagePicker nativo con base64");
}

const fechaUtils = path.join(root, "src/services/fechaCapturaUtils.ts");
if (!fs.existsSync(fechaUtils)) {
  fail("falta fechaCapturaUtils.ts");
} else {
  const fu = read("src/services/fechaCapturaUtils.ts");
  if (!fu.includes("hoyFechaUi") || !fu.includes("normalizarFechaCapturaAIso")) {
    fail("fechaCapturaUtils incompleto");
  } else {
    ok("fechaCapturaUtils");
  }
}

const app = read("app.json");
if (!app.includes("NSCameraUsageDescription") || !app.includes("cameraPermission")) {
  fail("app.json sin permiso de cámara (iOS plugin / infoPlist)");
} else {
  ok("permisos de cámara en app.json");
}
if (!app.includes("READ_MEDIA_IMAGES") && !app.includes("CAMERA")) {
  fail("app.json Android sin CAMERA / READ_MEDIA_IMAGES");
} else {
  ok("permisos Android de cámara/galería");
}

const pkg = read("package.json");
if (!pkg.includes("assert_foto_captura_persistente.mjs")) {
  fail("package.json assert debe incluir assert_foto_captura_persistente.mjs");
} else {
  ok("assert en package.json");
}

if (fallos) {
  console.error(`assert_foto_captura_persistente: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_foto_captura_persistente");
