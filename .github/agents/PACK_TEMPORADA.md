# Playbook IA — Pack norma de temporada

Objetivo: adaptar la app a la **norma oficial vigente** de cada provincia del repo, con el mínimo trabajo manual del dueño del producto.

## Contexto del producto

- App: Pesca Castellón (Expo) — provincias `castellon`, `sevilla`, `cordoba`, `cuenca`.
- La fecha del móvil **aplica** el pack embebido; **no descarga** el BO sola.
- Filosofía: semáforo legal honesto (oficial / aproximado / orientativo). No inventar vedas.

## Entradas

- Temporada objetivo: `YYYY` (la indica la issue o el briefing).
- Issue GitHub con label `pack-temporada` (si existe).

## Pasos obligatorios

1. **Leer fuentes oficiales** (no blogs):
   - Castellón / CV: DOGV + sede GVA pesca; cartografía ICV.
   - Sevilla / Córdoba: BOJA + visor Junta; DERA cotos.
   - Cuenca / CLM: DOCM Orden de vedas + visor JCCM.
   - Marítimo CS: BOE / MAPA / PescaREC solo si hay cambio relevante.
2. **Rellenar ficha de cambio** en el PR (por provincia):
   - URL + fecha de la norma
   - ¿Nueva orden o sigue vigente la anterior?
   - Cambios: fechas hábil, cupos, tallas, anexos tramos/cotos, vedados
3. **Actualizar código** solo donde haya cambio real:
   - `src/provincias/*/normativa.ts` y `FUENTE_NORMATIVA*` / `vigenciaNota`
   - `src/data/normativa2026.ts` / `src/services/vedaService.ts` si cambian periodos
   - species overrides / tallas / cupos en JSON de provincia
   - Vedados costa/mar JSON si aplica
4. **Cartografía** si cambian anexos:
   - `npm run sync:icv`
   - `npm run sync:sevilla`
   - `npm run sync:cordoba`
5. **Validar**:
   - `npm run season:briefing`
   - `npm run assert`
6. **PR a `main`** con:
   - Resumen en español sencillo
   - Lista “sin cambio / actualizado” por provincia
   - Enlaces a las normas usadas

## Prohibido

- Scrapear HTML inestable como única fuente de verdad.
- Cambiar norma “por si acaso” sin cita al BO.
- Quitar sellos OFICIAL / APROXIMADO / ORIENTATIVO.
- Afirmar “tiempo real IHM” si no hay integración real.

## Si no hay orden nueva

Confirmar en la web oficial que la orden anterior **sigue vigente**, actualizar `vigenciaNota` (“sigue vigente a DATE; sin orden YYYY nueva”) y abrir PR mínimo documentando la revisión.

## Definition of done

- Asserts verdes
- Cada provincia con fuente + nota de vigencia coherente con `YYYY`
- PR revisable por un no-técnico (qué cambió en 5 líneas)
