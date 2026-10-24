import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, Polyline } from 'react-native-maps';

import { mapsConfig } from '../../../config/maps';
import type { Coordinate, Hotspot, Route } from '../../../services/contracts';
import { tokens } from '../../../shared/theme/tokens';
import { hotspotFill, issueTypeDisplay } from '../constants/issueTypes';

interface SafetyMapCanvasProps {
  hotspots: Hotspot[];
  routes: Route[];
  selectedRouteId: string | null;
  origin: Coordinate | null;
  destination: Coordinate | null;
  originLabel: string;
  destinationLabel: string;
  hotspotLabel: (hotspot: Hotspot) => string;
  onMapPress: (coordinate: Coordinate) => void;
  onHotspotPress: (hotspot: Hotspot) => void;
}

export function SafetyMapCanvas({
  hotspots,
  routes,
  selectedRouteId,
  origin,
  destination,
  originLabel,
  destinationLabel,
  hotspotLabel,
  onMapPress,
  onHotspotPress,
}: SafetyMapCanvasProps) {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={mapsConfig.initialRegion}
        testID="safety-map"
        onPress={(event) => onMapPress(event.nativeEvent.coordinate)}
      >
        {hotspots.map((hotspot) => (
          <Circle
            key={`area-${hotspot.id}`}
            center={hotspot.center}
            radius={hotspot.radiusM}
            fillColor={hotspotFill(hotspot.intensity)}
            strokeColor={tokens.colors.status.error}
            strokeWidth={1}
          />
        ))}

        {/* One marker per aggregated area, carrying its dominant issue type.
            Individual reports are never plotted. */}
        {hotspots.map((hotspot) => (
          <Marker
            key={`marker-${hotspot.id}`}
            coordinate={hotspot.center}
            title={hotspotLabel(hotspot)}
            pinColor={issueTypeDisplay(hotspot.topCategories[0] ?? '').color}
            onPress={() => onHotspotPress(hotspot)}
          />
        ))}

        {/* Unselected routes stay visible so their issues can be compared. */}
        {routes.map((route) => (
          <Polyline
            key={route.id}
            coordinates={route.geometry}
            strokeWidth={route.id === selectedRouteId ? 6 : 3}
            strokeColor={
              route.id === selectedRouteId ? tokens.colors.primaryDark : tokens.colors.disabled
            }
          />
        ))}

        {origin ? <Marker coordinate={origin} title={originLabel} pinColor={tokens.colors.status.info} /> : null}
        {destination ? (
          <Marker coordinate={destination} title={destinationLabel} pinColor={tokens.colors.primaryDark} />
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 320,
    borderRadius: tokens.radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  map: { flex: 1 },
});
