# 🎣 Pesca Castellón

App móvil (iOS/Android) para pescadores de aguas continentales de la
provincia de Castellón: mapa de zonas, especies, mejores épocas del año,
diferenciación de especies invasoras y estado hidrológico en tiempo real.

## Estado actual (v0.6 — versión web para GitHub Pages / "Añadir a inicio" en iPhone)

Además de la app nativa (Expo Go), el proyecto ahora también se puede
**compilar como web y publicarse solo con GitHub Pages**, para abrirla
en Safari en el iPhone y usar "Añadir a pantalla de inicio" — sin pasar
por Expo Go ni por la App Store.

### Cómo publicarla

1. Sube este proyecto a un repositorio de GitHub (ver sección más abajo
   si aún no lo has hecho).
2. En el repo, ve a **Settings → Pages** y en "Build and deployment →
   Source" elige **GitHub Actions** (no "Deploy from a branch").
3. Haz cualquier cambio y `git push` a la rama `main` (o simplemente
   sube los archivos si aún no lo habías hecho) — el workflow
   `.github/workflows/deploy-web.yml` se ejecuta solo, compila la
   versión web con Expo y la publica.
4. Al cabo de 1-2 minutos, tu app estará en:
   `https://TU-USUARIO.github.io/pesca-castellon/`
5. Abre esa URL en **Safari** en el iPhone → botón compartir → **"Añadir
   a pantalla de inicio"**. Te quedará un icono como el de una app.

⚠️ **Importante sobre el nombre del repositorio**: en `app.json`, el
campo `experiments.baseUrl` está puesto como `/pesca-castellon`. Si
llamas al repositorio de otra forma, cambia ese valor a
`/nombre-exacto-de-tu-repo` antes de hacer push, o las rutas de los
archivos no cargarán bien.

### Qué cambia respecto a la app nativa (léelo antes de sorprenderte)

- **El mapa es distinto**: en la versión nativa usa Google/Apple Maps
  (`react-native-maps`); en la versión web usa **OpenStreetMap vía
  Leaflet** (`src/components/map/index.web.tsx`), porque
  `react-native-maps` no funciona en navegador. Metro elige el archivo
  correcto según la plataforma automáticamente
  (`index.native.tsx` vs `index.web.tsx`), así que el resto del código
  no ha tenido que cambiar.
- **Tocar el mapa** en la versión web dispara con un clic normal (no
  existe gesto de "mantener pulsado" en navegador de escritorio; en
  Safari móvil un toque normal funciona igual de bien).
- **Las alertas de buen día de pesca NO funcionan en la versión web**:
  las notificaciones programadas son una capacidad de la app nativa
  (`expo-notifications`), no del navegador. `notificationService.ts`
  detecta que está en web y simplemente no las programa, sin romper
  nada — pero si quieres esa función, necesitas la versión Expo Go o
  una futura build nativa real (TestFlight/App Store).
- El resto (ubicación, clima, previsión, índice de pesca, especies,
  aparejos, licencia) funciona igual en ambas versiones.

## Estado previo (v0.5 — índice de pesca, alertas y diseño moderno)

- ✅ **Índice de pesca diario (0-100)** (`fishingIndexService.ts`), basado
  en lo que coinciden en señalar webs especializadas y la sabiduría
  popular: presión atmosférica y su tendencia (bajando = favorable),
  nubosidad (moderada-alta mejor que sol pleno), viento (suave
  favorece, fuerte dispersa), probabilidad de lluvia (ligera = favorable)
  y fase lunar (teoría solunar: cerca de nueva/llena = mejor). Se
  categoriza en Excelente / Buena / Regular / Mala, con el desglose de
  motivos visible al tocar cada día en la pestaña Previsión.
- ✅ **Fase lunar calculada localmente** (`moonService.ts`), sin API
  externa, mediante el ciclo sinódico estándar.
- ✅ **Alertas automáticas** (`notificationService.ts`, con
  `expo-notifications`): si un día próximo es Bueno o Excelente, se
  programan dos avisos locales — la víspera a las 20:00 y la misma
  mañana a las 07:00 — con el índice y los motivos. Se recalculan cada
  vez que abres la pestaña Inicio.
- ✅ **Rediseño visual completo**: paleta con degradados
  (`expo-linear-gradient`), cabeceras degradadas en Inicio/Zona/Licencia/
  Aparejos, tarjetas de previsión coloreadas según el índice de pesca del
  día, y una **barra de pestañas flotante** con esquinas redondeadas y
  sombra elevada en vez de la barra plana estándar.

### Notificaciones: permisos y limitaciones

`expo-notifications` programa notificaciones **locales** (no requieren
backend ni servicio push): el propio sistema operativo las dispara en
la fecha/hora programada aunque la app esté cerrada. Eso sí, para que
seas conocedor de las limitaciones:
- Necesitan que el usuario conceda permiso de notificaciones (se pide
  automáticamente tras conceder el de ubicación).
- Se recalculan y reprograman cada vez que se abre la pestaña Inicio;
  si no abres la app varios días, no se generan avisos nuevos.
- En iOS, probarlas requiere un dispositivo físico o macOS con Simulator
  (las notificaciones programadas no siempre disparan igual en todos los
  simuladores).

## Estado previo (v0.4 — barra de 5 pestañas)

La app se ha reorganizado en una barra de navegación inferior con 5 pestañas:

1. **🏠 Inicio** (`HomeScreen.tsx`): mapa de la provincia con tu ubicación,
   fecha de hoy y el clima actual (temperatura, condición, viento) para
   donde estés, usando la API pública y gratuita **Open-Meteo** (sin
   necesidad de clave de API).
2. **🌊 Zonas libres** (`ZonasLibresScreen.tsx`): busca una zona escribiendo
   su nombre o mantén pulsado el mapa en cualquier punto, y te dice si
   es una **zona adecuada**, **vedada ahora mismo**, o si está **fuera
   de cualquier coto conocido** (probable agua libre, con aviso de
   revisar la normativa general).
3. **🐟 Especies** (`EspeciesScreen.tsx`): según tu ubicación o un punto
   que toques en el mapa, lista las especies presentes (con su estado
   de veda), marca las invasoras, y enlaza directamente a los aparejos
   recomendados para cada una. También incluye un catálogo completo
   desplegable de todas las especies de la provincia.
4. **🛠️ Aparejos** (`AparejosScreen.tsx`): selector de especie que
   muestra caña, carrete, línea, señuelos/cebos y técnica recomendada —
   independiente de la ubicación, como referencia rápida.
5. **☀️ Previsión** (`PrevisionScreen.tsx`): previsión meteorológica de
   7 días (temperatura máxima/mínima, probabilidad de lluvia, viento)
   para tu ubicación, también vía Open-Meteo.

Las fichas de zona (`ZoneDetailScreen.tsx`) y la información de licencia
(`LicenseScreen.tsx`) son accesibles desde varias pestañas mediante
navegación anidada (cada pestaña principal tiene su propio stack).

### Clima (nuevo)

`src/services/weatherService.ts` usa Open-Meteo para el tiempo actual
(pestaña Inicio) y la previsión de 7 días (pestaña Previsión). No
requiere clave de API ni configuración adicional — solo necesita
coordenadas, que obtenemos de `locationService.ts`.

## Estado previo (v0.3 — foco en zonas libres + aviso en vivo)

- ✅ **Pantalla principal nueva: seguimiento en vivo por GPS**
  (`LiveScreen.tsx`). Al abrir la app, pide permiso de ubicación y:
  - Te dice si estás **dentro** o **cerca** de un coto (⛔/⚠️, con
    vibración al entrar en cada estado)
  - Te dice si estás **dentro** o **cerca** de una **zona libre**
    conocida (✅/🌊)
  - Si no hay datos de la zona en la que estás, te lo dice también y
    te recuerda aplicar la normativa general
  - Lista debajo las **zonas libres más cercanas a ti**, ordenadas por
    distancia, con su estado de veda
- ✅ **Nuevas zonas libres reales** añadidas a `zones.json`
  (`estadoZona: "libre_sin_muerte"`): tramos "Libre Sin Muerte" del
  Mijares (Puebla de Arenoso) y del Palancia (Teresa, Teresa-Bejís,
  Embalse del Regajo) — datos de registros de pesca especializados.
  Recuerda: "libre sin muerte" significa que no necesitas permiso de
  coto, pero todo pez capturado debe devolverse vivo.
- ✅ El mapa completo (`MapScreen.tsx`) ahora distingue con color:
  🟢 zona libre · 🔵 coto sin invasoras · 🟠 coto con invasoras

### Permisos necesarios

Esta versión usa `expo-location` en primer plano (mientras la app está
abierta), no seguimiento en segundo plano. Al probarla con Expo Go te
pedirá permiso de ubicación "mientras se usa la app" — acéptalo para
que funcione el aviso en vivo.

## Estado previo (v0.2 — pulida)

- ✅ Estructura del proyecto (Expo + TypeScript + React Navigation)
- ✅ Mapa con zonas de ejemplo de Castellón (embalses del Mijares, Rambla
  de la Viuda, río Palancia, río Cenia, cabecera del Villahermosa)
- ✅ Filtro por especie
- ✅ **Toca (mantén pulsado) cualquier punto del mapa** y la app te dice
  si es una zona adecuada, libre o vedada, qué especies hay y qué
  equipo usar — ver `PointCheckScreen.tsx` y `geoService.ts`
- ✅ Ficha de zona: especies presentes, marcado de invasoras, mejores
  meses del año, estado de veda, clasificación oficial (vocación
  piscícola: salmonícola/ciprinícola)
- ✅ **Equipo de pesca recomendado por especie**: caña, carrete, línea,
  señuelos/cebos y técnica (`species.json` → campo `equipo`)
- ✅ **Aviso permanente de licencia obligatoria** (banner en todas las
  pantallas) + pantalla dedicada con tasas 2026, exenciones y enlace
  directo al trámite oficial de la GVA
- ✅ Servicio de datos hidrológicos con datos de ejemplo (a conectar con
  el SAIH oficial)
- ✅ Identidad visual propia (`src/theme.ts`): paleta verde bosque/azul
  agua, tarjetas con sombra, chips de filtro, badges de estado

### Dataset oficial confirmado (para profundizar la precisión)

He verificado que la Generalitat Valenciana publica el dataset real de
Zonas de Pesca Controlada con geometrías exactas (polígonos), nombre
oficial del coto, adjudicatario, "vocación piscícola" (salmonícola /
ciprinícola / ciprinícola modificado), superficie y km de cauce:

- Ficha del dataset: https://dadesobertes.gva.es/dataset/pesca-zonas-de-pesca-controlada-de-la-comunitat-valenciana
- Descarga CSV (con WKT de los polígonos): https://terramapas.icv.gva.es/0504_CazaPesca?request=GetFeature&service=WFS&version=2.0.0&typename=Pesca.ZonasControladas&outputformat=csv
- Descarga GeoPackage: mismo endpoint con `outputformat=gpkg`
- Servicio WMS/WFS en vivo: https://terramapas.icv.gva.es/0504_CazaPesca

Los polígonos vienen en **ETRS89 / UTM huso 30N (EPSG:25830)**, con miles
de vértices por coto — no los he embebido tal cual en la app porque
pesarían varios MB y no son manejables en un móvil sin procesarlos antes.
**Siguiente paso recomendado** para pasar de "radio aproximado" a
polígono real:

1. Descargar el GeoPackage completo.
2. Filtrar solo los registros de Castellón (columna `matricula`, prefijo
   `CS-` según el patrón visto en el dataset).
3. Simplificar la geometría (p. ej. con `mapshaper` o `ogr2ogr -simplify`)
   para reducir vértices sin perder la forma general.
4. Reproyectar de EPSG:25830 a EPSG:4326 (lat/lng estándar).
5. Exportar a GeoJSON y sustituir el campo `radioAproxKm` de
   `zones.json` por el polígono real, usando una librería de
   point-in-polygon (`geojson`, `@turf/boolean-point-in-polygon`) en
   `geoService.ts` en vez de la distancia al centroide.

### Licencia de pesca (verificado)

- Trámite oficial: https://sede.gva.es/es/detall-tramit?id_proc=681
- Vía alternativa sin certificado digital: https://agroambient.gva.es/es/web/medio-natural/llicencies-de-caca
- Tasas 2026: 9,35 € (1 año) / 26,19 € (3 años), modelo 046 concepto 9832
- Exentos: mayores de 67, menores de 14, pensionistas por incapacidad
  permanente, familias numerosas/monoparentales de categoría especial
- Oficina en Castellón: Av. Hermanos Bou, 47 · 12003 Castelló de la Plana

Estos importes se revisan cada ejercicio — antes de cada temporada
conviene volver a verificarlos en la sede electrónica.

### Limitaciones que quedan pendientes

- ⚠️ **Las coordenadas y radios de zona son aproximados** (a nivel de
  embalse/tramo, con un radio estimado), no el polígono oficial del
  coto todavía — ver sección anterior para el siguiente paso.
- ⚠️ **Los periodos de veda son de referencia** (basados en la Orden
  30/2016 y modificaciones) — hay que revisarlos cada temporada contra
  la resolución anual vigente.
- ⚠️ El chequeo "toca el mapa" es una aproximación por distancia al
  centro de la zona conocida más cercana; cerca de los límites reales
  del coto puede equivocarse hasta que se integre el polígono oficial.

## Cómo probarla en tu móvil (sin compilar nada)

1. Instala Node.js (versión 18 o superior) en tu ordenador.
2. Instala la app **Expo Go** en tu móvil (Android: Play Store / iOS:
   App Store).
3. En tu ordenador, dentro de esta carpeta:
   ```bash
   npm install
   npx expo start
   ```
4. Se abrirá una pantalla con un código QR. Escanéalo con la app Expo Go
   (Android: desde la propia app; iOS: desde la cámara) y la app se
   cargará en tu móvil al momento, sin necesidad de Xcode/Android Studio.

## Cómo subirlo a GitHub

```bash
cd pesca-castellon
git init
git add .
git commit -m "Primera versión: mapa de zonas de pesca en Castellón"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/pesca-castellon.git
git push -u origin main
```

## Próximos pasos sugeridos (para ir puliendo)

1. **Sustituir datos de ejemplo por el dataset oficial de la GVA**
   (zonas de pesca controlada, cotos, especies por tramo).
2. **Conectar el SAIH real** (`src/services/saihService.ts` ya tiene la
   estructura lista; solo falta mapear cada zona a su estación oficial
   del SAIH Júcar o SAIH Ebro).
3. Añadir buscador/filtro por municipio o cuenca.
4. Añadir capa de "cotos vedados vs. libres" con polígonos reales.
5. Sistema de favoritos y notificaciones ("avísame cuando el black bass
   entre en época buena en mi zona guardada").
6. Publicar en Google Play / App Store cuando esté validada (requiere
   cuenta de desarrollador y `eas build`).

## Estructura del proyecto

```
pesca-castellon/
├── App.tsx                     # Entrada + navegación (4 pantallas)
├── src/
│   ├── theme.ts                # Paleta de colores e identidad visual
│   ├── data/
│   │   ├── species.json        # Catálogo de especies + equipo recomendado
│   │   ├── zones.json          # Zonas de pesca (embalses, ríos, cotos)
│   │   └── license.ts          # Info de la licencia obligatoria (tasas, links)
│   ├── components/
│   │   ├── LicenseBanner.tsx   # Aviso reutilizable de licencia obligatoria
│   │   └── map/
│   │       ├── index.native.tsx  # Mapa en iOS/Android (react-native-maps)
│   │       └── index.web.tsx     # Mapa en navegador (Leaflet/OpenStreetMap)
│   ├── screens/
│   │   ├── HomeScreen.tsx        # 🏠 Pestaña 1: mapa + ubicación + fecha + clima actual
│   │   ├── ZonasLibresScreen.tsx # 🌊 Pestaña 2: buscar/tocar mapa → adecuada/libre/vedada
│   │   ├── EspeciesScreen.tsx    # 🐟 Pestaña 3: especies según ubicación o punto tocado
│   │   ├── AparejosScreen.tsx    # 🛠️ Pestaña 4: selector de especie → equipo recomendado
│   │   ├── PrevisionScreen.tsx   # ☀️ Pestaña 5: previsión meteorológica de 7 días
│   │   ├── ZoneDetailScreen.tsx  # Ficha de zona (accesible desde varias pestañas)
│   │   └── LicenseScreen.tsx     # Pantalla dedicada a la licencia de pesca
│   └── services/
│       ├── fishingIndexService.ts # Índice de pesca 0-100 (presión, nubes, viento, lluvia, luna)
│       ├── moonService.ts      # Fase lunar (cálculo local, sin API)
│       ├── notificationService.ts # Programa alertas de buen día de pesca
│       ├── weatherService.ts   # Clima actual y previsión (Open-Meteo)
│       ├── locationService.ts  # Permiso y ubicación GPS
│       ├── saihService.ts      # Datos hidrológicos en tiempo real
│       ├── vedaService.ts      # Cálculo de periodos hábiles/veda
│       └── geoService.ts       # Distancia, "zona más cercana" y proximidad
```
