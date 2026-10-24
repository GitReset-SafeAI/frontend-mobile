import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, Polyline } from 'react-native-maps';

import { mapsConfig } from '../../../config/maps';
import type { Coordinate, Hotspot, Route } from '../../../services/contracts';
import { tokens } from '../../../shared/theme/tokens';
import { hotspotFill, hotspotMarkerColor } from '../constants/issueTypes';

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
  onRoutePress: (routeId: string) => void;
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
  onRoutePress,
}: SafetyMapCanvasProps) {
  const mapRef = useRef<MapView | null>(null);

  // Frame the journey once routes arrive, the way a map app zooms to fit.
  useEffect(() => {
    const points = routes.flatMap((route) => route.geometry);
    if (points.length < 2) return;
    mapRef.current?.fitToCoordinates?.(points, {
      edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
      animated: true,
    });
  }, [routes]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
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
            pinColor={hotspotMarkerColor(hotspot)}
            onPress={() => onHotspotPress(hotspot)}
          />
        ))}

        {/* Unselected routes stay visible so their issues can be compared, and
            the selected one is drawn last so it sits on top. */}
        {[...routes]
          .sort((a, b) => Number(a.id === selectedRouteId) - Number(b.id === selectedRouteId))
          .map((route) => (
            <Polyline
              key={route.id}
              coordinates={route.geometry}
              tappable
              onPress={() => onRoutePress(route.id)}
              strokeWidth={route.id === selectedRouteId ? 7 : 4}
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
    height: 360,
    borderRadius: tokens.radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  map: { flex: 1 },
});
