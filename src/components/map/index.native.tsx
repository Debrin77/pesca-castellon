/**
 * En iOS/Android, Metro elige este archivo. Reexportamos react-native-maps
 * e ignoramos props solo-web; cameraTarget anima la cámara.
 */
import React, { useEffect, useRef } from "react";
import MapViewRN, { Marker, Circle, Polygon as PolygonRN, MapViewProps } from "react-native-maps";

type CameraTarget = {
  latitude: number;
  longitude: number;
  zoom?: number;
  nonce: number;
};

type Props = MapViewProps & {
  fitCoordinates?: { latitude: number; longitude: number }[];
  cameraTarget?: CameraTarget;
};

export default function MapView({ fitCoordinates: _omit, cameraTarget, ...props }: Props) {
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

  return <MapViewRN ref={ref} {...props} />;
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
