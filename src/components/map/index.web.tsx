/**
 * Mapa web (Leaflet). Metro elige este archivo en vez de index.native.tsx.
 * Teselas Carto / relieve / satélite, pines con forma, pulso de ubicación
 * y controles de capas. Misma API que react-native-maps en lo que usa la app.
 */
import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import {
  MapContainer,
  TileLayer,
  Marker as LeafletMarker,
  Circle as LeafletCircle,
  Polygon as LeafletPolygon,
  Popup,
  useMap,
  useMapEvents,
  LayersControl,
  ZoomControl,
  ScaleControl,
  WMSTileLayer,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const CSS_ID = "pesca-leaflet-theme";

function inyectarCssMapa() {
  if (typeof document === "undefined" || document.getElementById(CSS_ID)) return;
  const style = document.createElement("style");
  style.id = CSS_ID;
  style.textContent = `
    .pesca-map .leaflet-container {
      font-family: "Source Sans 3", system-ui, sans-serif;
      background: #d5e4d8;
    }
    .pesca-map.pesca-map-mar .leaflet-container {
      background: #c5dce6;
    }
    .pesca-map .leaflet-control-zoom,
    .pesca-map .leaflet-control-layers,
    .pesca-map .leaflet-control-scale {
      border: none !important;
      border-radius: 12px !important;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(12, 44, 32, 0.16) !important;
    }
    .pesca-map .leaflet-control-zoom a {
      width: 36px !important;
      height: 36px !important;
      line-height: 36px !important;
      color: #164a36 !important;
      font-weight: 700;
    }
    .pesca-map .leaflet-control-layers {
      background: rgba(255,255,255,0.96);
    }
    .pesca-map .leaflet-control-layers-toggle {
      width: 38px !important;
      height: 38px !important;
    }
    .pesca-map .leaflet-popup-content-wrapper {
      border-radius: 14px;
      box-shadow: 0 10px 28px rgba(12, 44, 32, 0.18);
      padding: 2px 4px;
    }
    .pesca-map .leaflet-popup-content {
      margin: 10px 12px;
      font-size: 13px;
      font-weight: 650;
      color: #122018;
    }
    .pesca-map .leaflet-popup-tip {
      box-shadow: none;
    }
    .pesca-pin {
      position: relative;
      width: 22px;
      height: 32px;
    }
    .pesca-pin span {
      display: block;
      width: 22px;
      height: 22px;
      border-radius: 50% 50% 50% 0;
      background: var(--pin, #164a36);
      transform: rotate(-45deg);
      border: 2px solid #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.28);
    }
    .pesca-pin i {
      position: absolute;
      left: 7px;
      top: 7px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255,255,255,0.92);
      z-index: 1;
    }
    .pesca-user-marker { background: transparent !important; border: none !important; }
    .pesca-pulse {
      position: relative;
      width: 28px;
      height: 28px;
    }
    .pesca-pulse-dot {
      position: absolute;
      left: 8px; top: 8px;
      width: 12px; height: 12px;
      background: #1a6f8a;
      border: 2px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 0 2px rgba(26,111,138,0.25);
      z-index: 2;
    }
    .pesca-pulse-ring {
      position: absolute;
      left: 0; top: 0;
      width: 28px; height: 28px;
      border-radius: 50%;
      background: rgba(26,111,138,0.28);
      animation: pesca-ping 1.8s ease-out infinite;
    }
    @keyframes pesca-ping {
      0% { transform: scale(0.55); opacity: 0.85; }
      100% { transform: scale(1.55); opacity: 0; }
    }
    .pesca-map .leaflet-control-attribution {
      background: rgba(255,255,255,0.82) !important;
      font-size: 10px;
      max-width: 70%;
    }
  `;
  document.head.appendChild(style);
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

function zoomDesdeDelta(delta?: number): number {
  if (!delta) return 9;
  if (delta > 1.2) return 8;
  if (delta > 0.7) return 9;
  if (delta > 0.35) return 10;
  if (delta > 0.12) return 11;
  if (delta > 0.05) return 12;
  return 13;
}

function tipoMarcador(identifier?: string, pinColor?: string, title?: string): "user" | "spot" | "pin" {
  if (identifier === "user" || title === "Tú") return "user";
  if (identifier === "spot" || pinColor === "#c4921a" || pinColor === "#f9a825") return "spot";
  return "pin";
}

function iconoMarcador(pinColor: string, identifier?: string, title?: string) {
  const tipo = tipoMarcador(identifier, pinColor, title);
  if (tipo === "user") {
    return L.divIcon({
      className: "pesca-user-marker",
      html: `<div class="pesca-pulse"><span class="pesca-pulse-ring"></span><span class="pesca-pulse-dot"></span></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -12],
    });
  }
  return L.divIcon({
    className: "pesca-pin-wrap",
    html: `<div class="pesca-pin" style="--pin:${pinColor}"><i></i><span></span></div>`,
    iconSize: [22, 32],
    iconAnchor: [11, 30],
    popupAnchor: [0, -28],
  });
}

function SincronizarRegion({ region, disabled }: { region?: Region; disabled?: boolean }) {
  const map = useMap();
  const ultima = useRef<string>("");
  useEffect(() => {
    if (disabled || !region) return;
    const clave = `${region.latitude.toFixed(3)}|${region.longitude.toFixed(3)}|${region.latitudeDelta ?? 0}`;
    if (clave === ultima.current) return;
    ultima.current = clave;
    map.setView([region.latitude, region.longitude], zoomDesdeDelta(region.latitudeDelta));
  }, [disabled, map, region?.latitude, region?.longitude, region?.latitudeDelta]);
  return null;
}

function EncajarCoordenadas({ coords }: { coords?: { latitude: number; longitude: number }[] }) {
  const map = useMap();
  const hecho = useRef(false);
  useEffect(() => {
    if (hecho.current || !coords || coords.length < 2) return;
    hecho.current = true;
    const bounds = L.latLngBounds(coords.map((c) => [c.latitude, c.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 11 });
  }, [coords, map]);
  return null;
}

function ManejadorClick({ onLongPress }: { onLongPress?: (e: any) => void }) {
  useMapEvents({
    click(e) {
      onLongPress?.({ nativeEvent: { coordinate: { latitude: e.latlng.lat, longitude: e.latlng.lng } } });
    },
  });
  return null;
}

function VolarA({ target }: { target?: { latitude: number; longitude: number; zoom?: number; nonce: number } }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    const zoom = Math.min(target.zoom ?? 14, 16);
    map.flyTo([target.latitude, target.longitude], zoom, { duration: 0.7 });
  }, [map, target?.nonce]);
  return null;
}

interface MapViewProps {
  style?: any;
  region?: Region;
  initialRegion?: Region;
  onLongPress?: (e: any) => void;
  onPress?: (e: any) => void;
  children?: React.ReactNode;
  fitCoordinates?: { latitude: number; longitude: number }[];
  cameraTarget?: { latitude: number; longitude: number; zoom?: number; nonce: number };
  accent?: "bosque" | "mar";
}

export default function MapView({
  style,
  region,
  initialRegion,
  onLongPress,
  onPress,
  children,
  fitCoordinates,
  cameraTarget,
  accent = "bosque",
}: MapViewProps) {
  inyectarCssMapa();
  const inicio = initialRegion || region || { latitude: 40.12, longitude: -0.35, latitudeDelta: 1.15 };

  return (
    <View style={[{ flex: 1 }, style]}>
      <MapContainer
        className={`pesca-map${accent === "mar" ? " pesca-map-mar" : ""}`}
        center={[inicio.latitude, inicio.longitude]}
        zoom={zoomDesdeDelta(inicio.latitudeDelta)}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        zoomControl={false}
        attributionControl={true}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Mapa">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              maxZoom={18}
              maxNativeZoom={18}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Mapa IGN">
            <TileLayer
              attribution='CC BY 4.0 scne.es · <a href="https://www.ign.es">IGN</a>'
              url="https://www.ign.es/wmts/ign-base?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=IGNBaseTodo&STYLE=default&FORMAT=image/png&TILEMATRIXSET=GoogleMapsCompatible&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Relieve">
            <TileLayer
              attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              maxZoom={17}
              maxNativeZoom={17}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satélite IGN">
            <TileLayer
              attribution="PNOA-MA © IGN-CNIG"
              url="https://www.ign.es/wmts/pnoa-ma?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OI.OrthoimageCoverage&STYLE=default&FORMAT=image/jpeg&TILEMATRIXSET=GoogleMapsCompatible&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          <LayersControl.Overlay name="WMS ICV (ríos / cotos)">
            <WMSTileLayer
              url="https://terramapas.icv.gva.es/0504_CazaPesca"
              layers="Pesca.ZonasControladas,Pesca.ZonasReserva.TruchaComun,Pesca.ZonasReserva.Anguila"
              format="image/png"
              transparent={true}
              opacity={0.45}
              attribution="ICV / GVA"
            />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="Profundidad EMODnet (no navegar)">
            <WMSTileLayer
              url="https://ows.emodnet-bathymetry.eu/wms"
              layers="mean_atlas_land"
              format="image/png"
              transparent={true}
              opacity={0.55}
              attribution="EMODnet Bathymetry"
            />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="Carta IHM (no navegar)">
            <WMSTileLayer
              url="https://ideihm.covam.es/wms/enc"
              layers="RasterENC"
              format="image/png"
              transparent={true}
              opacity={0.72}
              attribution="© Instituto Hidrográfico de la Marina — no válido para navegación"
            />
          </LayersControl.Overlay>
        </LayersControl>
        <ZoomControl position="bottomright" />
        <ScaleControl position="bottomleft" imperial={false} />
        <SincronizarRegion region={region} disabled={!!fitCoordinates?.length || !!cameraTarget} />
        <EncajarCoordenadas coords={fitCoordinates} />
        <VolarA target={cameraTarget} />
        {(onPress || onLongPress) && <ManejadorClick onLongPress={onPress || onLongPress} />}
        {children}
      </MapContainer>
    </View>
  );
}

interface MarkerProps {
  coordinate: { latitude: number; longitude: number };
  pinColor?: string;
  title?: string;
  onPress?: () => void;
  children?: React.ReactNode;
  identifier?: string;
}

export function Marker({
  coordinate,
  pinColor = "#164a36",
  title,
  onPress,
  children,
  identifier,
}: MarkerProps) {
  return (
    <LeafletMarker
      position={[coordinate.latitude, coordinate.longitude]}
      icon={iconoMarcador(pinColor, identifier, title)}
      eventHandlers={{ click: () => onPress?.() }}
    >
      {(title || children) && <Popup>{children ?? title}</Popup>}
    </LeafletMarker>
  );
}

interface CircleProps {
  center: { latitude: number; longitude: number };
  radius: number;
  strokeColor?: string;
  fillColor?: string;
}

export function Circle({
  center,
  radius,
  strokeColor = "#164a36",
  fillColor = "rgba(22,74,54,0.12)",
}: CircleProps) {
  return (
    <LeafletCircle
      center={[center.latitude, center.longitude]}
      radius={radius}
      pathOptions={{
        color: strokeColor,
        fillColor,
        weight: 1.5,
        opacity: 0.75,
        fillOpacity: 0.22,
      }}
    />
  );
}

interface PolygonProps {
  coordinates: { latitude: number; longitude: number }[];
  holes?: { latitude: number; longitude: number }[][];
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
}

export function Polygon({
  coordinates,
  holes = [],
  strokeColor = "#164a36",
  fillColor = "#164a36",
  strokeWidth = 2,
}: PolygonProps) {
  const positions = [
    coordinates.map((c) => [c.latitude, c.longitude] as [number, number]),
    ...holes.map((h) => h.map((c) => [c.latitude, c.longitude] as [number, number])),
  ];
  return (
    <LeafletPolygon
      positions={positions}
      pathOptions={{
        color: strokeColor,
        fillColor,
        weight: strokeWidth,
        opacity: 0.95,
        fillOpacity: strokeWidth >= 4 ? 0.4 : 0.28,
        interactive: false,
      }}
    />
  );
}
