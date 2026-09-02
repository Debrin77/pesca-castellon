/**
 * En iOS/Android, Metro elige este archivo. Reexportamos react-native-maps
 * e ignoramos props solo-web (fitCoordinates).
 */
import React from "react";
import MapViewRN, { Marker, Circle, MapViewProps } from "react-native-maps";

type Props = MapViewProps & {
  fitCoordinates?: { latitude: number; longitude: number }[];
};

export default function MapView({ fitCoordinates: _omit, ...props }: Props) {
  return <MapViewRN {...props} />;
}

export { Marker, Circle };
