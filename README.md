# Pesca Castellón

App de pesca **personal e íntima** para salir al agua con criterio: normativa
local, clima, índice de pesca, diario de capturas y ritual de salida. Pensada
para ti y tu provincia — **compartir un punto es opcional, no la finalidad**.

Hoy cubre **Castellón** (ríos/embalses + costa), **Sevilla** y **Córdoba** (continental Andalucía).
Expo (iOS/Android) + versión web para GitHub Pages / “Añadir a inicio” en iPhone.

## Filosofía del producto

| Sí | No |
| --- | --- |
| Cuaderno privado en el dispositivo | Feed social / ranking |
| PIN + biometría para proteger capturas y sitios | Cuenta obligatoria en la nube |
| Semáforo legal claro (oficial vs orientativo) | Sustituir el cartel o la sede oficial |
| Exportar GPX cuando *tú* quieras | Publicar GPS de capturas por defecto |

## Estado actual (v0.7)

### Entrada y privacidad
- **Presentación estilo App Store** al entrar (pantallas a pantalla completa con
  virtudes de la app). Se cierra con la **✕** arriba a la derecha o al final
  con “Empezar a pescar”. Se puede volver a ver desde **Ajustes**.
- **Bloqueo con PIN** (4–8 dígitos), configurable en Ajustes, con teclado numérico
  a pantalla completa al abrir o al volver de segundo plano.
- **Biometría** (Face ID / huella) opcional una vez activo el PIN.
- Datos locales (favoritos, puntos, capturas); el PIN se guarda como hash en el
  dispositivo.

### Provincias y mapa
- Selector de provincia: **Castellón**, **Sevilla** y **Córdoba**.
- Mapa nativo (`react-native-maps`) / web (Leaflet + OpenStreetMap).
- Capas de cotos/tramos (ICV en Castellón), vedados de costa, puertos, radar de
  lluvia, puntos y capturas personales.
- Consulta al tocar el mapa: ¿puedo pescar aquí? (semaforo + certeza oficial vs
  orientativo). **«SIN TRAMO» no es veda**: el tramo no está dibujado; confirma
  el cartel.

### Inicio y salida
- Veredicto rápido: **¿Puedo?** (norma) vs **¿Pinta?** (meteo).
- Índice de pesca 0–100, clima Open-Meteo, hidrología SAIH (CHJ / CHG).
- Flujo **«Salgo a pescar»** y **primera salida** para principiantes.
- Checklist, avisos de seguridad, recomendaciones del día.

### Especies, aparejos y consejos
- Catálogo continental y de costa (orilla) según provincia.
- Montajes por especie con fotos de elementos, aparejos y consejos visuales.
- Identificación asistida por rasgos (no es un modelo de IA en dispositivo).

### Previsión
- 7 días de meteo + índice diario.
- Ventanas solunar / marea (costa) cuando aplica.
- Alertas locales de buen día (solo app nativa, no web).

### Capturas (diario íntimo)
- Favoritos, puntos guardados y capturas con foto/GPS.
- Cupos, filtro por ámbito, exportar **GPX** (compartir es una acción, no un feed).

### Licencia y cumplimiento
- Tasas, exenciones y enlaces al trámite oficial por provincia.
- Banner / deep-link a **PescaREC** en contextos marítimos (obligación estatal;
  esta app no sustituye declaraciones).

## Pestañas

1. **Inicio** — veredicto, clima, SAIH, atajos a salir / primera salida.
2. **Mapa** — zonas, consulta al tocar, radar, puntos personales.
3. **Especies** — catálogo + mapa por tramo/costa.
4. **Previsión** — 7 días + solunar/marea.
5. **Capturas** — favoritos, puntos, diario, GPX.

(Aparejos, consejos, licencia y ajustes viven en stacks anidados.)

## Web / GitHub Pages

1. En el repo: **Settings → Pages → Source: GitHub Actions**.
2. Push a `main` → workflow `.github/workflows/deploy-web.yml`.
3. URL típica: `https://<usuario>.github.io/pesca-castellon/`
4. En Safari (iPhone): Compartir → **Añadir a pantalla de inicio**.

En `app.json`, `experiments.baseUrl` debe coincidir con el nombre del repo
(p. ej. `/pesca-castellon`).

### Diferencias web vs nativa
| Capacidad | Nativa | Web |
| --- | --- | --- |
| Mapa | Apple/Google Maps | Leaflet / OSM |
| Notificaciones de buen día | Sí (`expo-notifications`) | No |
| Face ID / huella | Sí | Solo PIN |
| Resto (clima, índice, capturas, PIN) | Sí | Sí |

## Cómo probar (Expo Go)

```bash
npm install
npx expo start
```

Escanea el QR con Expo Go (Android) o la cámara (iOS).

Scripts útiles:
- `npm run assert` — comprobaciones de regresión de producto.
- `npm run build:web` — export estático web.
- `npm run sync:icv` / `npm run sync:sevilla` / `npm run sync:cordoba` — regenerar cartografía embebida.

## Estructura (resumen)

```
App.tsx                 # Entrada, tabs, presentación, bloqueo PIN
src/
  screens/              # Inicio, Mapa, Especies, Previsión, Capturas, …
  components/           # Mapa, semáforo, montajes, PantallaBloqueo, …
  services/             # Clima, índice, SAIH, acceso PIN, offline, GPX, …
  provincias/           # Config Castellón + Sevilla + Córdoba
  data/                 # Especies, zonas, normativa, montajes, consejos
  context/              # Provincia, acceso, punto de consulta
```

## Limitaciones conocidas

- Geometrías y vedas: mejorar precisión cada temporada (fuentes oficiales).
- Cobertura geográfica limitada a las provincias cargadas.
- Identificación de especie por rasgos, no por foto con ML.
- Sin tiendas App Store / Play todavía (Expo Go + PWA).
- PescaREC es complemento obligatorio en marítimo estatal; aquí solo se enlaza.

## Próximos pasos alineados con el producto

1. Más provincias con el mismo nivel de detalle (normativa + mapa + especies).
2. Build TestFlight / Play cuando el núcleo esté validado.
3. Diario más rico (notas de agua/señuelo) y backup privado cifrado.
4. Compartir selectivo (un punto / una captura) con aviso de precisión GPS.
5. No construir red social ni heatmaps públicos como eje del producto.

## Licencia de pesca (referencia; verificar cada temporada)

- GVA (Castellón / C. Valenciana): sede electrónica de licencia de pesca.
- Andalucía (Sevilla / Córdoba): licencia continental + seguro RC del pescador cuando aplique.
- Pesca marítima recreativa / declaraciones: app oficial **PescaREC** (MAPA).
