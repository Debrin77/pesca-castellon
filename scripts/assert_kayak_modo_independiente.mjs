/**
 * Assert: kayak es modalidad global independiente (continental + mar),
 * separada de barco; continental distingue río / embalse / kayak.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let fallos = 0;
function fail(msg) {
  console.error("FAIL", msg);
  fallos++;
}
function ok(msg) {
  console.log("OK", msg);
}
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const modo = read("src/data/modoPesca.ts");
for (const n of [
  '"kayak"',
  '"kayak_mar"',
  '"embalse"',
  "esModoKayak",
  "grupoModo",
  "modosDelGrupo",
  "pistaModo",
  "etiquetaGrupoModo",
]) {
  if (!modo.includes(n)) fail(`modoPesca sin ${n}`);
}
if (!modo.includes('return ["rio", "embalse", "kayak"]')) {
  fail("continentalOnly debe ofrecer río, embalse y kayak");
}
if (!modo.includes('"kayak_mar"') || !modo.includes('"barco"')) {
  fail("Castellón debe separar kayak_mar y barco");
}
if (/Embarcación \/ kayak/.test(modo)) {
  fail("ya no se debe etiquetar barco como «Embarcación / kayak»");
}
ok("modoPesca: kayak independiente");

const modalidades = read("src/data/modalidades.ts");
if (!modalidades.includes("kayak_embalse")) fail("falta modalidad kayak_embalse");
if (!modalidades.includes("modalidadDesdeModoGlobal")) {
  fail("falta modalidadDesdeModoGlobal");
}
if (!/artefacto flotante/i.test(modalidades)) {
  fail("kayak mar debe citar artefacto flotante");
}
ok("modalidades kayak embalse + mar");

const selector = read("src/components/SelectorModoPesca.tsx");
for (const n of [
  "esModoKayak",
  "btnOnKayak",
  "btnKayakIdle",
  "GrupoFila",
  "Continental",
  "estrella",
  "pistaModo",
]) {
  if (!selector.includes(n)) fail(`SelectorModoPesca sin ${n}`);
}
ok("SelectorModoPesca destaca kayak");

const banner = read("src/components/BannerKayakDestacado.tsx");
for (const n of [
  "PESCA EN KAYAK",
  "documentacionKayakDeProvincia",
  "Qué documentación pedir",
  "artefacto flotante",
]) {
  if (!banner.toLowerCase().includes(n.toLowerCase())) fail(`BannerKayakDestacado sin ${n}`);
}
ok("BannerKayakDestacado");

const home = read("src/screens/HomeScreen.tsx");
if (!home.includes("BannerKayakDestacado")) fail("Home debe montar BannerKayakDestacado");
if (!home.includes("esModoKayak") || !home.includes("esModoEmbarcado")) {
  fail("Home debe usar helpers kayak/embarcado");
}
if (!home.includes("GRADIENTS.kayak")) fail("Home CTA kayak con gradiente propio");
if (!home.includes("Salgo en kayak")) fail("Home debe etiquetar Salgo en kayak");
ok("Home kayak");

const mapa = read("src/screens/ZonasLibresScreen.tsx");
if (!mapa.includes("modalidadDesdeModoGlobal")) fail("Mapa sin modalidadDesdeModoGlobal");
if (!mapa.includes("modoKayak")) fail("Mapa sin modoKayak");
if (!mapa.includes("COLORS.kayakDark")) fail("Mapa header kayak");
ok("Mapa kayak");

const salgoBarco = read("src/screens/SalgoEnBarcoScreen.tsx");
if (!salgoBarco.includes("esKayak") || !salgoBarco.includes("kayak_mar")) {
  fail("SalgoEnBarco debe ramificar kayak vs barco");
}
if (!salgoBarco.includes("Salgo en kayak")) fail("SalgoEnBarco título kayak");
ok("SalgoEnBarco distingue kayak");

const theme = read("src/theme.ts");
if (!theme.includes("kayak:") || !theme.includes("kayakDark") || !theme.includes("kayakSun")) {
  fail("theme sin colores kayak");
}
if (!theme.includes("kayak: [")) fail("theme sin GRADIENTS.kayak");
ok("theme kayak");

const pkg = read("package.json");
if (!pkg.includes("assert_kayak_modo_independiente.mjs")) {
  fail("package.json debe incluir assert_kayak_modo_independiente.mjs");
}

if (fallos) {
  console.error(`assert_kayak_modo_independiente: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_kayak_modo_independiente");
