/**
 * En iOS/Android, Metro elige automáticamente este archivo (index.native.tsx)
 * en vez de index.web.tsx. Simplemente reexportamos react-native-maps tal cual,
 * así el resto de la app usa siempre "../components/map" sin preocuparse
 * de en qué plataforma corre.
 */
import MapView, { Marker, Circle } from "react-native-maps";

export default MapView;
export { Marker, Circle };
