/**
 * Assert: CTAs de Inicio (Salgo / Siguiente paso) clicables en web.
 * ListaAnimada no debe animar transform en web; PulsePress usa TouchableOpacity en web.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
let fallos = 0;
function fail(msg) {
  console.error(`FAIL ${msg}`);
  fallos++;
}

const lista = fs.readFileSync(path.join(root, "src/components/ListaAnimada.tsx"), "utf8");
if (!lista.includes('Platform.OS === "web"') || !lista.includes("sin animación")) {
  fail("ListaAnimada debe evitar animación de transform en web (hit-test)");
}
if (!lista.includes('pointerEvents="auto"')) {
  fail("ListaAnimada debe usar pointerEvents auto");
}

const pulse = fs.readFileSync(path.join(root, "src/components/PulsePress.tsx"), "utf8");
if (!pulse.includes("TouchableOpacity") || !pulse.includes('Platform.OS === "web"')) {
  fail("PulsePress en web debe usar TouchableOpacity");
}

const home = fs.readFileSync(path.join(root, "src/screens/HomeScreen.tsx"), "utf8");
if (!home.includes('navigate("SalgoAPescar")') || !home.includes("ctaSalgoTitle")) {
  fail("Home debe navegar a SalgoAPescar desde el CTA grande");
}
// Los CTAs principales no deben ir dentro de ListaAnimada (evita regresiones web)
const iSalgo = home.indexOf("ctaSalgoTitle");
const ventana = home.slice(Math.max(0, iSalgo - 600), iSalgo);
if (ventana.includes("<ListaAnimada")) {
  fail("CTA Salgo a pescar no debe ir envuelto en ListaAnimada");
}

const pkg = fs.readFileSync(path.join(root, "package.json"), "utf8");
if (!pkg.includes("assert_cta_salgo_clicable.mjs")) {
  fail("package.json assert debe incluir assert_cta_salgo_clicable.mjs");
}

if (fallos) {
  console.error(`assert_cta_salgo_clicable: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("OK assert_cta_salgo_clicable");
