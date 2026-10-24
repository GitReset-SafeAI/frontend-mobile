import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, Icon, Text } from 'react-native-paper';

import type {
  Coordinate,
  Hotspot,
  HotspotsRequest,
  TimeBucketFilter,
} from '../../../services/contracts';
import { LanguageSwitcher } from '../../../shared/components/LanguageSwitcher';
import { useCurrentLocation } from '../../../shared/hooks/useCurrentLocation';
import { ScreenContainer } from '../../../shared/layouts/ScreenContainer';
import { tokens } from '../../../shared/theme/tokens';
import { HotspotDetailCard } from '../components/HotspotDetailCard';
import { JourneyPlanner, type PlannerTarget } from '../components/JourneyPlanner';
import { MapEvidenceNotice } from '../components/MapEvidenceNotice';
import { RouteComparisonCard } from '../components/RouteComparisonCard';
import { SafetyMapCanvas } from '../components/SafetyMapCanvas';
import { TimeBucketSelector } from '../components/TimeBucketSelector';
import { useHotspots } from '../hooks/useHotspots';
import { useRouteComparison } from '../hooks/useRouteComparison';

// Western Sri Lanka overview. Not a user's or an incident's location.
const defaultBounds: HotspotsRequest['bounds'] = {
  southWest: { latitude: 6.78, longitude: 79.8 },
  northEast: { latitude: 7.0, longitude: 79.95 },
};

export function SafetyMapScreen() {
  const { t } = useTranslation('safety');
  const [timeBucket, setTimeBucket] = useState<TimeBucketFilter>('all');
  const [origin, setOrigin] = useState<Coordinate | null>(null);
  const [destination, setDestination] = useState<Coordinate | null>(null);
  const [activeTarget, setActiveTarget] = useState<PlannerTarget>('origin');
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const request = useMemo<HotspotsRequest>(
    () => ({ bounds: defaultBounds, timeBucket }),
    [timeBucket],
  );
  const hotspotsQuery = useHotspots(request);
  const comparison = useRouteComparison();
  const location = useCurrentLocation();

  const handleMapPress = useCallback(
    (coordinate: Coordinate) => {
      setSelectedHotspot(null);
      if (activeTarget === 'origin') {
        setOrigin(coordinate);
        // Match the familiar flow: setting a start moves you on to the end.
        setActiveTarget('destination');
      } else {
        setDestination(coordinate);
      }
    },
    [activeTarget],
  );

  const handleUseCurrentLocation = useCallback(async () => {
    const coordinate = await location.request();
    if (!coordinate) return;
    if (activeTarget === 'origin') {
      setOrigin(coordinate);
      setActiveTarget('destination');
    } else {
      setDestination(coordinate);
    }
  }, [activeTarget, location]);

  const handleCompare = useCallback(() => {
    if (!origin || !destination) return;
    comparison.mutate(
      { origin, destination, timeBucket },
      { onSuccess: (result) => setSelectedRouteId(result.recommendedRouteId ?? result.routes[0].id) },
    );
  }, [comparison, destination, origin, timeBucket]);

  const handleClear = useCallback(() => {
    setOrigin(null);
    setDestination(null);
    setActiveTarget('origin');
    setSelectedRouteId(null);
    comparison.reset();
  }, [comparison]);

  const handleSwap = useCallback(() => {
    setOrigin(destination);
    setDestination(origin);
  }, [destination, origin]);

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

      <SafetyMapCanvas
        hotspots={hotspots}
        routes={routes}
        selectedRouteId={selectedRouteId}
        origin={origin}
        destination={destination}
        originLabel={t('planner.start')}
        destinationLabel={t('planner.end')}
        hotspotLabel={(hotspot) =>
          t('map.reportCount', {
            count: hotspot.reportCount,
            days: hotspotsQuery.data?.windowDays ?? 30,
          })
        }
        onMapPress={handleMapPress}
        onHotspotPress={setSelectedHotspot}
      />

      <TimeBucketSelector value={timeBucket} onChange={setTimeBucket} />

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

      {selectedHotspot ? (
        <HotspotDetailCard
          hotspot={selectedHotspot}
          windowDays={hotspotsQuery.data?.windowDays ?? 30}
          onDismiss={() => setSelectedHotspot(null)}
        />
      ) : null}

      <JourneyPlanner
        origin={origin}
        destination={destination}
        activeTarget={activeTarget}
        isLocating={location.status === 'loading'}
        isComparing={comparison.isPending}
        onSelectTarget={setActiveTarget}
        onUseCurrentLocation={handleUseCurrentLocation}
        onSwap={handleSwap}
        onClear={handleClear}
        onCompare={handleCompare}
      />

      {location.status === 'denied' ? (
        <Text variant="bodyMedium" style={styles.muted}>{t('planner.locationDenied')}</Text>
      ) : null}
      {location.status === 'unavailable' ? (
        <Text variant="bodyMedium" style={styles.muted}>{t('planner.locationUnavailable')}</Text>
      ) : null}

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
