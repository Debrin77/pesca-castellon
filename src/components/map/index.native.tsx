/**
 * En iOS/Android, Metro elige este archivo. Reexportamos react-native-maps
 * e ignoramos props solo-web; cameraTarget anima la cámara.
 * Soporta UrlTile para radar / batimetría cuando se pasan props.
 */
import React, { useEffect, useRef } from "react";
import MapViewRN, {
  Marker,
  Circle,
  Polygon as PolygonRN,
  Polyline as PolylineRN,
  UrlTile,
  WMSTile,
  MapViewProps,
} from "react-native-maps";

type CameraTarget = {
  latitude: number;
  longitude: number;
  zoom?: number;
  nonce: number;
};

type Props = MapViewProps & {
  fitCoordinates?: { latitude: number; longitude: number }[];
  cameraTarget?: CameraTarget;
  accent?: "bosque" | "mar";
  pescaWms?: string;
  radarUrl?: string | null;
  showRadar?: boolean;
  showBathymetry?: boolean;
};

export default function MapView({
  fitCoordinates: _omit,
  cameraTarget,
  accent: _accent,
  pescaWms: _wms,
  radarUrl = null,
  showRadar = false,
  showBathymetry = false,
  children,
  ...props
}: Props) {
  const ref = useRef<MapViewRN>(null);

  useEffect(() => {
    if (!cameraTarget || !ref.current) return;
    const delta = cameraTarget.zoom && cameraTarget.zoom >= 14 ? 0.04 : 0.12;
    ref.current.animateToRegion(
      {
        latitude: cameraTarget.latitude,
        longitude: cameraTarget.longitude,
        latitudeDelta: delta,
        longitudeDelta: delta,
      },
      650
    );
  }, [cameraTarget?.nonce]);

  return (
    <MapViewRN ref={ref} {...props}>
      {showBathymetry ? (
        <WMSTile
          urlTemplate="https://ows.emodnet-bathymetry.eu/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=mean_atlas_land&WIDTH=256&HEIGHT=256&SRS=EPSG:3857&BBOX={minX},{minY},{maxX},{maxY}"
          opacity={0.5}
          zIndex={2}
        />
      ) : null}
      {showRadar && radarUrl ? (
        <UrlTile urlTemplate={radarUrl} opacity={0.65} zIndex={5} />
      ) : null}
      {children}
    </MapViewRN>
  );
}

export { Marker, Circle };

export function Polygon({
  coordinates,
  holes = [],
  strokeColor = "#164a36",
  fillColor = "#164a36",
  strokeWidth = 2,
}: {
  coordinates: { latitude: number; longitude: number }[];
  holes?: { latitude: number; longitude: number }[][];
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
}) {
  return (
    <PolygonRN
      coordinates={coordinates}
      holes={holes}
      strokeColor={strokeColor}
      fillColor={fillColor + "48"}
      strokeWidth={strokeWidth}
    />
  );
}

export function Polyline({
  coordinates,
  strokeColor = "#1a6f8a",
  strokeWidth = 4,
}: {
  coordinates: { latitude: number; longitude: number }[];
  strokeColor?: string;
  strokeWidth?: number;
}) {
  if (coordinates.length < 2) return null;
  return (
    <PolylineRN coordinates={coordinates} strokeColor={strokeColor} strokeWidth={strokeWidth} />
  );
}
