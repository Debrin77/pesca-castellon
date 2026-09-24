/**
 * Tras `expo export --platform web`, inyecta meta PWA / apple-touch-icon en index.html
 * para que «Añadir a pantalla de inicio» en iPhone use el logo del parche.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = path.join(root, "dist", "index.html");

if (!fs.existsSync(indexPath)) {
  console.error("inject_pwa_icons: falta dist/index.html (ejecuta expo export antes)");
  process.exit(1);
}

const base = "/pesca-castellon";
const tags = [
  `<link rel="apple-touch-icon" href="${base}/apple-touch-icon.png" />`,
  `<link rel="manifest" href="${base}/manifest.webmanifest" />`,
  `<meta name="apple-mobile-web-app-capable" content="yes" />`,
  `<meta name="mobile-web-app-capable" content="yes" />`,
  `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />`,
  `<meta name="apple-mobile-web-app-title" content="Vámonos" />`,
].join("");

let html = fs.readFileSync(indexPath, "utf8");
if (html.includes("apple-touch-icon")) {
  console.log("inject_pwa_icons: ya estaba inyectado");
  process.exit(0);
}
if (!html.includes("</head>")) {
  console.error("inject_pwa_icons: index.html sin </head>");
  process.exit(1);
}
html = html.replace("</head>", `${tags}</head>`);
fs.writeFileSync(indexPath, html);
console.log("OK inject_pwa_icons");
