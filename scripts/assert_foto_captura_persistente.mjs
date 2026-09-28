/**
 * Assert: las fotos de capturas se persisten (no URIs temporales del picker).
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
}

const catches = read("src/screens/MyCatchesScreen.tsx");
if (!catches.includes("fotoDesdeAsset") || !catches.includes("persistirFotoCaptura")) {
  fail("MyCatchesScreen debe usar fotoDesdeAsset / persistirFotoCaptura");
} else {
  ok("MyCatchesScreen persiste fotos al elegir/guardar");
}
if (!catches.includes("base64: true")) {
  fail("ImagePicker debe pedir base64: true para persistir en web/nativo");
} else {
  ok("ImagePicker con base64");
}
if (!catches.includes("elegirFotoWebFallback")) {
  fail("Capturas debe tener fallback web para elegir foto");
} else {
  ok("fallback web de galería");
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
