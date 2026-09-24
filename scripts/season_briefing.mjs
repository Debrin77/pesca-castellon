/**
 * Briefing de pack de temporada (humano + IA + GitHub Actions).
 *
 * Uso:
 *   node scripts/season_briefing.mjs
 *   node scripts/season_briefing.mjs --issue-body
 *   node scripts/season_briefing.mjs --github-out   # escribe temporada=YYYY
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const args = new Set(process.argv.slice(2));

function temporadaObjetivo(ahora = new Date()) {
  const y = ahora.getFullYear();
  const m = ahora.getMonth() + 1; // 1-12
  // Nov–dic: miramos la temporada del año siguiente.
  if (m >= 11) return y + 1;
  return y;
}

const TEMPORADA = (() => {
  const forced = process.env.TEMPORADA || process.env.temporada;
  if (forced && /^\d{4}$/.test(forced)) return Number(forced);
  return temporadaObjetivo();
})();

const PROVINCIAS = [
  {
    id: "castellon",
    nombre: "Castellón (CV)",
    fuentes: [
      "https://dogv.gva.es/",
      "https://sede.gva.es/",
      "Norma embebida: src/data/normativa2026.ts + ICV (npm run sync:icv)",
    ],
  },
  {
    id: "sevilla",
    nombre: "Sevilla (Andalucía)",
    fuentes: [
      "https://www.juntadeandalucia.es/boja",
      "https://www.juntadeandalucia.es/medioambiente/portal/web/caza-y-pesca/pesca-continental/vedas-periodos-habiles",
      "npm run sync:sevilla",
    ],
  },
  {
    id: "cordoba",
    nombre: "Córdoba (Andalucía)",
    fuentes: [
      "https://www.juntadeandalucia.es/boja",
      "Misma Orden andaluza que Sevilla si no hay resolución propia",
      "npm run sync:cordoba",
    ],
  },
  {
    id: "cuenca",
    nombre: "Cuenca (CLM)",
    fuentes: [
      "https://docm.castillalamancha.es/",
      "https://cazaypesca.castillalamancha.es/pesca/ejercicio-pesca",
      "src/provincias/cuenca/normativa.ts",
    ],
  },
];

function issueBody() {
  return `# Pack temporada ${TEMPORADA}

## Para ti (sin ser informático)

1. Abre **Cursor → Cloud Agent** en el repo \`pesca-castellon\`.
2. Pega el prompt de abajo.
3. Cuando haya **Pull Request**, revísalo y fusiónalo si está bien.
4. Guía larga: \`.github/PARA_TI_TEMPORADA.md\`

### Prompt para Cursor Agent

\`\`\`
Sigue el playbook .github/agents/PACK_TEMPORADA.md
Temporada objetivo: ${TEMPORADA}

1) Revisa BO/DOGV/BOJA/DOCM de Castellón, Sevilla, Córdoba y Cuenca.
2) Actualiza el pack de norma + sync de mapas si hace falta.
3) Ejecuta: npm run season:briefing && npm run assert
4) Abre PR a main con resumen claro (qué cambió / qué sigue vigente).
\`\`\`

## Provincias

${PROVINCIAS.map(
  (p) => `### ${p.nombre}
${p.fuentes.map((f) => `- ${f}`).join("\n")}`
).join("\n\n")}

## Checklist

- [ ] Castellón
- [ ] Sevilla
- [ ] Córdoba
- [ ] Cuenca
- [ ] Marítimo CS si aplica
- [ ] vigenciaNota / FUENTE_NORMATIVA
- [ ] sync mapas si hubo anexos nuevos
- [ ] npm run assert OK
- [ ] PR abierto

---
_Issue generada automáticamente por \`season-check\` / \`season_briefing.mjs\`._
`;
}

function consola() {
  const lines = [
    `Pack temporada objetivo: ${TEMPORADA}`,
    "",
    "Provincias:",
    ...PROVINCIAS.flatMap((p) => [`- ${p.nombre}`, ...p.fuentes.map((f) => `    · ${f}`)]),
    "",
    "Comandos:",
    "  npm run season:briefing",
    "  npm run assert",
    "  npm run sync:icv | sync:sevilla | sync:cordoba",
    "",
    "Playbook IA: .github/agents/PACK_TEMPORADA.md",
    "Guía simple: .github/PARA_TI_TEMPORADA.md",
  ];
  return lines.join("\n");
}

if (args.has("--github-out")) {
  // GitHub Actions: KEY=value
  process.stdout.write(`temporada=${TEMPORADA}\n`);
} else if (args.has("--issue-body")) {
  process.stdout.write(issueBody());
} else {
  console.log(consola());
}

// Export ligero para tests/assert
export { TEMPORADA, PROVINCIAS, temporadaObjetivo };
