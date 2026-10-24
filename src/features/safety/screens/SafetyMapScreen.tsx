import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, Icon, Text } from 'react-native-paper';

import type {
  Coordinate,
  Hotspot,
  HotspotsRequest,
  PlaceSuggestion,
  TimePeriodFilter,
} from '../../../services/contracts';
import { LanguageSwitcher } from '../../../shared/components/LanguageSwitcher';
import { useCurrentLocation } from '../../../shared/hooks/useCurrentLocation';
import { ScreenContainer } from '../../../shared/layouts/ScreenContainer';
import { tokens } from '../../../shared/theme/tokens';
import { HotspotDetailCard } from '../components/HotspotDetailCard';
import {
  JourneyPlanner,
  type PlannerPoint,
  type PlannerTarget,
} from '../components/JourneyPlanner';
import { MapEvidenceNotice } from '../components/MapEvidenceNotice';
import { RouteComparisonCard } from '../components/RouteComparisonCard';
import { SafetyMapCanvas } from '../components/SafetyMapCanvas';
import { TimePeriodSelector } from '../components/TimePeriodSelector';
import { useHotspots } from '../hooks/useHotspots';
import { currentTimePeriod } from '../utils/currentTimePeriod';
import { useRouteComparison } from '../hooks/useRouteComparison';

// Western Sri Lanka overview. Not a user's or an incident's location.
const defaultBounds: HotspotsRequest['bounds'] = {
  southWest: { latitude: 6.78, longitude: 79.8 },
  northEast: { latitude: 7.0, longitude: 79.95 },
};

export function SafetyMapScreen() {
  const { t } = useTranslation('safety');
  // Defaults to the period you are actually travelling in; every other
  // period, and "any time", stay one tap away.
  const [timePeriod, setTimePeriod] = useState<TimePeriodFilter>(() => currentTimePeriod());
  const [origin, setOrigin] = useState<PlannerPoint | null>(null);
  const [destination, setDestination] = useState<PlannerPoint | null>(null);
  const [activeTarget, setActiveTarget] = useState<PlannerTarget>('origin');
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const request = useMemo<HotspotsRequest>(
    () => ({ bounds: defaultBounds, timePeriod }),
    [timePeriod],
  );
  const hotspotsQuery = useHotspots(request);
  const comparison = useRouteComparison();
  const location = useCurrentLocation();

  const setPoint = useCallback((target: PlannerTarget, point: PlannerPoint) => {
    if (target === 'origin') {
      setOrigin(point);
      // Match the familiar flow: setting a start moves you on to the end.
      setActiveTarget('destination');
    } else {
      setDestination(point);
    }
  }, []);

  const handleMapPress = useCallback(
    (coordinate: Coordinate) => {
      setSelectedHotspot(null);
      setPoint(activeTarget, {
        label: `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
        coordinate,
      });
    },
    [activeTarget, setPoint],
  );

  const handleSelectPlace = useCallback(
    (target: PlannerTarget, place: PlaceSuggestion) => {
      setPoint(target, { label: place.name, coordinate: place.coordinate });
    },
    [setPoint],
  );

  const handleClearPoint = useCallback((target: PlannerTarget) => {
    if (target === 'origin') setOrigin(null);
    else setDestination(null);
    setSelectedRouteId(null);
  }, []);

  const handleUseCurrentLocation = useCallback(async () => {
    const coordinate = await location.request();
    if (!coordinate) return;
    setPoint(activeTarget, { label: t('planner.myLocation'), coordinate });
  }, [activeTarget, location, setPoint, t]);

  const handleCompare = useCallback(() => {
    if (!origin || !destination) return;
    comparison.mutate(
      { origin: origin.coordinate, destination: destination.coordinate, timePeriod },
      { onSuccess: (result) => setSelectedRouteId(result.recommendedRouteId ?? result.routes[0].id) },
    );
  }, [comparison, destination, origin, timePeriod]);

  const handleSwap = useCallback(() => {
    setOrigin(destination);
    setDestination(origin);
  }, [destination, origin]);

  const currentPeriod = useMemo(() => currentTimePeriod(), []);
  const hotspots = hotspotsQuery.data?.hotspots ?? [];
  const routes = comparison.data?.routes ?? [];

  return (
    <ScreenContainer>
      <View style={styles.brand}>
        <Icon source="map-marker-radius-outline" size={32} color={tokens.colors.primary} />
        <View style={styles.brandText}>
          <Text variant="titleLarge" style={styles.heading} accessibilityRole="header">
            {t('title')}
          </Text>
          <Text variant="bodyMedium" style={styles.muted}>{t('map.title')}</Text>
        </View>
      </View>
      <LanguageSwitcher />

      <JourneyPlanner
        origin={origin}
        destination={destination}
        activeTarget={activeTarget}
        isLocating={location.status === 'loading'}
        isComparing={comparison.isPending}
        onSelectTarget={setActiveTarget}
        onSelectPlace={handleSelectPlace}
        onClearPoint={handleClearPoint}
        onUseCurrentLocation={handleUseCurrentLocation}
        onSwap={handleSwap}
        onCompare={handleCompare}
      />

      {location.status === 'denied' ? (
        <Text variant="bodyMedium" style={styles.muted}>{t('planner.locationDenied')}</Text>
      ) : null}
      {location.status === 'unavailable' ? (
        <Text variant="bodyMedium" style={styles.muted}>{t('planner.locationUnavailable')}</Text>
      ) : null}

      <SafetyMapCanvas
        hotspots={hotspots}
        routes={routes}
        selectedRouteId={selectedRouteId}
        origin={origin?.coordinate ?? null}
        destination={destination?.coordinate ?? null}
        originLabel={origin?.label ?? t('planner.start')}
        destinationLabel={destination?.label ?? t('planner.end')}
        hotspotLabel={(hotspot) =>
          t('map.reportCount', {
            count: hotspot.reportCount,
            days: hotspotsQuery.data?.windowDays ?? 30,
          })
        }
        onMapPress={handleMapPress}
        onHotspotPress={setSelectedHotspot}
        onRoutePress={setSelectedRouteId}
      />

      {comparison.isError ? (
        <Card mode="outlined" style={styles.errorCard}>
          <Card.Content>
            <Text variant="bodyLarge">{t('routes.loadFailed')}</Text>
          </Card.Content>
        </Card>
      ) : null}

      {comparison.data ? (
        <RouteComparisonCard
          comparison={comparison.data}
          selectedRouteId={selectedRouteId}
          onSelectRoute={setSelectedRouteId}
        />
      ) : null}

      {selectedHotspot ? (
        <HotspotDetailCard
          hotspot={selectedHotspot}
          windowDays={hotspotsQuery.data?.windowDays ?? 30}
          onDismiss={() => setSelectedHotspot(null)}
        />
      ) : null}

      <TimePeriodSelector
        value={timePeriod}
        currentPeriod={currentPeriod}
        onChange={setTimePeriod}
      />

      {hotspotsQuery.isPending ? (
        <ActivityIndicator accessibilityLabel={t('map.loading')} />
      ) : null}

      {hotspotsQuery.isError ? (
        <Card mode="outlined" style={styles.errorCard}>
          <Card.Content>
            <Text variant="bodyLarge">{t('map.loadFailed')}</Text>
          </Card.Content>
        </Card>
      ) : null}

      {hotspotsQuery.data ? <MapEvidenceNotice result={hotspotsQuery.data} /> : null}

      <Card mode="outlined" style={styles.card}>
        <Card.Title title={t('estimateTitle')} titleNumberOfLines={3} />
        <Card.Content>
          <Text variant="bodyLarge">{t('estimateDescription')}</Text>
        </Card.Content>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md },
  brandText: { flex: 1, gap: tokens.spacing.xs },
  heading: { color: tokens.colors.primaryDark },
  muted: { color: tokens.colors.textSecondary },
  card: { borderColor: tokens.colors.border },
  errorCard: { borderColor: tokens.colors.status.error },
});
