/**
 * Assert: icono PWA / apple-touch para «Añadir a pantalla de inicio» en iPhone.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let fallos = 0;
function fail(m) {
  console.error("FAIL", m);
  fallos++;
}

const pub = path.join(root, "public");
for (const f of [
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512.png",
  "manifest.webmanifest",
]) {
  if (!fs.existsSync(path.join(pub, f))) fail(`falta public/${f}`);
}

const man = fs.readFileSync(path.join(pub, "manifest.webmanifest"), "utf8");
for (const n of [
  "Vámonos de pesca",
  "standalone",
  "/pesca-castellon/",
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512.png",
  "#0c2c20",
]) {
  if (!man.includes(n)) fail(`manifest.webmanifest sin ${n}`);
}

const touch = fs.statSync(path.join(pub, "apple-touch-icon.png"));
if (touch.size < 5_000 || touch.size > 120_000) {
  fail(`apple-touch-icon.png tamaño raro (${touch.size} bytes)`);
}

const chrome = fs.readFileSync(path.join(root, "src/webChrome.ts"), "utf8");
for (const n of [
  "apple-touch-icon",
  "apple-mobile-web-app-capable",
  "apple-mobile-web-app-title",
  "manifest.webmanifest",
  "inyectarMetaPwa",
]) {
  if (!chrome.includes(n)) fail(`webChrome sin ${n}`);
}

const inject = fs.readFileSync(path.join(root, "scripts/inject_pwa_icons.mjs"), "utf8");
for (const n of ["apple-touch-icon", "manifest.webmanifest", "apple-mobile-web-app-capable"]) {
  if (!inject.includes(n)) fail(`inject_pwa_icons sin ${n}`);
}

const pkg = fs.readFileSync(path.join(root, "package.json"), "utf8");
if (!pkg.includes("inject_pwa_icons.mjs")) {
  fail("package.json build:web debe ejecutar inject_pwa_icons.mjs");
}

const wf = fs.readFileSync(path.join(root, ".github/workflows/deploy-web.yml"), "utf8");
if (!wf.includes("npm run build:web")) {
  fail("deploy-web.yml debe usar npm run build:web (export + inject PWA)");
}

if (fallos) {
  console.error(`assert_pwa_icono: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_pwa_icono");
