import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Text } from 'react-native-paper';

import type { PlaceSuggestion } from '../../../services/contracts';
import { tokens } from '../../../shared/theme/tokens';
import { PlaceSearchField } from './PlaceSearchField';

export type PlannerTarget = 'origin' | 'destination';

export interface PlannerPoint {
  label: string;
  coordinate: { latitude: number; longitude: number };
}

interface JourneyPlannerProps {
  origin: PlannerPoint | null;
  destination: PlannerPoint | null;
  activeTarget: PlannerTarget;
  isLocating: boolean;
  isComparing: boolean;
  onSelectTarget: (target: PlannerTarget) => void;
  onSelectPlace: (target: PlannerTarget, place: PlaceSuggestion) => void;
  onClearPoint: (target: PlannerTarget) => void;
  onUseCurrentLocation: () => void;
  onSwap: () => void;
  onCompare: () => void;
}

export function JourneyPlanner({
  origin,
  destination,
  activeTarget,
  isLocating,
  isComparing,
  onSelectTarget,
  onSelectPlace,
  onClearPoint,
  onUseCurrentLocation,
  onSwap,
  onCompare,
}: JourneyPlannerProps) {
  const { t } = useTranslation('safety');

  return (
    <Card mode="outlined" style={styles.card}>
      <Card.Title title={t('planner.title')} titleNumberOfLines={2} />
      <Card.Content style={styles.content}>
        <View style={styles.fields}>
          <View style={styles.inputs}>
            <PlaceSearchField
              label={t('planner.start')}
              icon="circle-outline"
              testID="planner-origin"
              value={origin?.label ?? ''}
              placeholder={t('planner.searchPlaceholder')}
              onFocus={() => onSelectTarget('origin')}
              onSelect={(place) => onSelectPlace('origin', place)}
              onClear={() => onClearPoint('origin')}
            />
            <PlaceSearchField
              label={t('planner.end')}
              icon="map-marker"
              testID="planner-destination"
              value={destination?.label ?? ''}
              placeholder={t('planner.searchPlaceholder')}
              onFocus={() => onSelectTarget('destination')}
              onSelect={(place) => onSelectPlace('destination', place)}
              onClear={() => onClearPoint('destination')}
            />
          </View>
          <IconButton
            icon="swap-vertical"
            accessibilityLabel={t('planner.swap')}
            disabled={!origin && !destination}
            onPress={onSwap}
          />
        </View>

        <View style={styles.actions}>
          <Button mode="text" icon="crosshairs-gps" loading={isLocating} onPress={onUseCurrentLocation}>
            {t('planner.useMyLocation')}
          </Button>
        </View>

        {/* Tapping the map stays available for places that are not listed, and
            for anyone who would rather point than type. */}
        <Text variant="bodySmall" style={styles.hint}>
          {t(activeTarget === 'origin' ? 'planner.hintOrigin' : 'planner.hintDestination')}
        </Text>

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
  content: { gap: tokens.spacing.sm },
  fields: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs },
  inputs: { flex: 1, gap: tokens.spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap' },
  hint: { color: tokens.colors.textSecondary },
});
