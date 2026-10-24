import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, Polyline } from 'react-native-maps';

import { mapsConfig } from '../../../config/maps';
import type { Coordinate, Hotspot, Route } from '../../../services/contracts';
import { tokens } from '../../../shared/theme/tokens';
import { hotspotFill, hotspotMarkerColor } from '../constants/issueTypes';
import { HotspotCountLabel, RouteDurationLabel } from './MapLabels';

interface SafetyMapCanvasProps {
  hotspots: Hotspot[];
  routes: Route[];
  selectedRouteId: string | null;
  origin: Coordinate | null;
  destination: Coordinate | null;
  originLabel: string;
  destinationLabel: string;
  hotspotLabel: (hotspot: Hotspot) => string;
  routeLabel: (route: Route) => string;
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
  routeLabel,
  onHotspotPress,
  onRoutePress,
}: SafetyMapCanvasProps) {
  const mapRef = useRef<MapView | null>(null);
  // A marker with custom contents must redraw while it mounts, then stop:
  // leaving tracking on re-rasterises every label on each frame and stutters.
  // Tracking is derived from whether this set of labels has settled yet, so
  // changing the labels starts it again without a render-time state write.
  const labelSignature = `${hotspots.length}|${routes.length}|${selectedRouteId ?? ''}`;
  const [settledSignature, setSettledSignature] = useState<string | null>(null);
  const tracksLabels = settledSignature !== labelSignature;

  useEffect(() => {
    const timer = setTimeout(() => setSettledSignature(labelSignature), 1200);
    return () => clearTimeout(timer);
  }, [labelSignature]);

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
      >
        {hotspots.map((hotspot) => (
          <Circle
            key={`area-${hotspot.id}`}
            center={hotspot.center}
            radius={hotspot.radiusM}
            fillColor={hotspotFill(hotspot.intensity)}
            strokeColor={tokens.colors.map.areaOutline}
            strokeWidth={1}
          />
        ))}

        {/* One marker per aggregated area, showing how many reports are behind
            it. Individual reports are never plotted. */}
        {hotspots.map((hotspot) => (
          <Marker
            key={`marker-${hotspot.id}`}
            coordinate={hotspot.center}
            title={hotspotLabel(hotspot)}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={tracksLabels}
            onPress={() => onHotspotPress(hotspot)}
          >
            <HotspotCountLabel
              count={hotspot.reportCount}
              color={hotspotMarkerColor(hotspot)}
            />
          </Marker>
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
                route.id === selectedRouteId ? tokens.colors.map.route : tokens.colors.map.routeAlternative
              }
            />
          ))}

        {/* Walking time sits on each route, as on a familiar map. */}
        {routes.map((route) => {
          const midpoint = route.geometry[Math.floor(route.geometry.length / 2)];
          if (!midpoint) return null;
          return (
            <Marker
              key={`duration-${route.id}`}
              coordinate={midpoint}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={tracksLabels}
              title={routeLabel(route)}
              onPress={() => onRoutePress(route.id)}
            >
              <RouteDurationLabel
                minutes={Math.max(1, Math.round(route.durationSeconds / 60))}
                extraMinutes={Math.round(route.extraDurationSeconds / 60)}
                selected={route.id === selectedRouteId}
              />
            </Marker>
          );
        })}

        {origin ? <Marker coordinate={origin} title={originLabel} pinColor={tokens.colors.map.origin} /> : null}
        {destination ? (
          <Marker coordinate={destination} title={destinationLabel} pinColor={tokens.colors.map.destination} />
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
