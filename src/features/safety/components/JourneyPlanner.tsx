import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Icon, SegmentedButtons, Text } from 'react-native-paper';

import type { Coordinate } from '../../../services/contracts';
import { tokens } from '../../../shared/theme/tokens';

export type PlannerTarget = 'origin' | 'destination';

interface JourneyPlannerProps {
  origin: Coordinate | null;
  destination: Coordinate | null;
  activeTarget: PlannerTarget;
  isLocating: boolean;
  isComparing: boolean;
  onSelectTarget: (target: PlannerTarget) => void;
  onUseCurrentLocation: () => void;
  onSwap: () => void;
  onClear: () => void;
  onCompare: () => void;
}

function formatPoint(point: Coordinate | null, fallback: string) {
  if (!point) return fallback;
  return `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`;
}

export function JourneyPlanner({
  origin,
  destination,
  activeTarget,
  isLocating,
  isComparing,
  onSelectTarget,
  onUseCurrentLocation,
  onSwap,
  onClear,
  onCompare,
}: JourneyPlannerProps) {
  const { t } = useTranslation('safety');

  return (
    <Card mode="outlined" style={styles.card}>
      <Card.Title title={t('planner.title')} titleNumberOfLines={2} />
      <Card.Content style={styles.content}>
        <Text variant="bodyMedium" style={styles.hint}>
          {t(activeTarget === 'origin' ? 'planner.hintOrigin' : 'planner.hintDestination')}
        </Text>

        <SegmentedButtons
          value={activeTarget}
          onValueChange={(value) => onSelectTarget(value as PlannerTarget)}
          buttons={[
            { value: 'origin', label: t('planner.start'), icon: 'map-marker-outline' },
            { value: 'destination', label: t('planner.end'), icon: 'flag-checkered' },
          ]}
        />

        <View style={styles.row}>
          <Icon source="map-marker-outline" size={20} color={tokens.colors.status.info} />
          <Text variant="bodyMedium" style={styles.value}>
            {`${t('planner.start')}: ${formatPoint(origin, t('planner.notSet'))}`}
          </Text>
        </View>
        <View style={styles.row}>
          <Icon source="flag-checkered" size={20} color={tokens.colors.primaryDark} />
          <Text variant="bodyMedium" style={styles.value}>
            {`${t('planner.end')}: ${formatPoint(destination, t('planner.notSet'))}`}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button mode="text" icon="crosshairs-gps" loading={isLocating} onPress={onUseCurrentLocation}>
            {t('planner.useMyLocation')}
          </Button>
          <Button mode="text" icon="swap-vertical" onPress={onSwap} disabled={!origin || !destination}>
            {t('planner.swap')}
          </Button>
          <Button mode="text" icon="close" onPress={onClear} disabled={!origin && !destination}>
            {t('planner.clear')}
          </Button>
        </View>

        <Button
          mode="contained"
          icon="directions"
          loading={isComparing}
          disabled={!origin || !destination || isComparing}
          onPress={onCompare}
        >
          {t('planner.compare')}
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderColor: tokens.colors.border },
  content: { gap: tokens.spacing.md },
  hint: { color: tokens.colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  value: { flex: 1, color: tokens.colors.textPrimary },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.xs },
});
