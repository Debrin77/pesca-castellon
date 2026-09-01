/**
 * Equivalente web de react-native-maps, usado solo cuando la app corre
 * en un navegador (Safari en iPhone, Chrome, etc.). Metro elige este
 * archivo automáticamente en vez de index.native.tsx al compilar para web.
 *
 * Usa OpenStreetMap a través de Leaflet: no requiere ninguna clave de API,
 * a diferencia de Google Maps en Android.
 *
 * Implementa solo el subconjunto de props de react-native-maps que usa
 * esta app (region/initialRegion, onLongPress, Marker con coordinate/
 * pinColor/title/onPress, Circle con center/radius/strokeColor/fillColor),
 * para que el resto del código no necesite saber en qué plataforma corre.
 */
import React, { useEffect } from "react";
import { View } from "react-native";
import {
  MapContainer,
  TileLayer,
  Marker as LeafletMarker,
  Circle as LeafletCircle,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

function zoomDesdeDelta(delta?: number): number {
  if (!delta) return 9;
  if (delta > 1) return 8;
  if (delta > 0.5) return 9;
  if (delta > 0.2) return 10;
  if (delta > 0.05) return 12;
  return 13;
}

function iconoColor(color: string) {
  return L.divIcon({
    className: "pesca-marker",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,0.45)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function SincronizarRegion({ region }: { region?: Region }) {
  const map = useMap();
  useEffect(() => {
    if (region) {
      map.setView([region.latitude, region.longitude], zoomDesdeDelta(region.latitudeDelta));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region?.latitude, region?.longitude, region?.latitudeDelta]);
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

interface MapViewProps {
  style?: any;
  region?: Region;
  initialRegion?: Region;
  onLongPress?: (e: any) => void;
  children?: React.ReactNode;
}

export default function MapView({ style, region, initialRegion, onLongPress, children }: MapViewProps) {
  const inicio = region || initialRegion || { latitude: 40.15, longitude: -0.2, latitudeDelta: 1.4 };

  return (
    <View style={[{ flex: 1 }, style]}>
      <MapContainer
        center={[inicio.latitude, inicio.longitude]}
        zoom={zoomDesdeDelta(inicio.latitudeDelta)}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <SincronizarRegion region={region} />
        {onLongPress && <ManejadorClick onLongPress={onLongPress} />}
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
}

export function Marker({ coordinate, pinColor = "#1b5e3f", title, onPress, children }: MarkerProps) {
  return (
    <LeafletMarker
      position={[coordinate.latitude, coordinate.longitude]}
      icon={iconoColor(pinColor)}
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

export function Circle({ center, radius, strokeColor = "#1b5e3f", fillColor = "rgba(27,94,63,0.15)" }: CircleProps) {
  return (
    <LeafletCircle
      center={[center.latitude, center.longitude]}
      radius={radius}
      pathOptions={{ color: strokeColor, fillColor }}
    />
  );
}
