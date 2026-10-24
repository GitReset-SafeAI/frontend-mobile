import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, IconButton, SegmentedButtons, Text } from 'react-native-paper';

import type { PlaceSuggestion, TravelMode } from '../../../services/contracts';
import { SectionCard } from '../../../shared/components/SectionCard';
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
  isLocating: boolean;
  isComparing: boolean;
  travelMode: TravelMode;
  onSelectTravelMode: (mode: TravelMode) => void;
  onSelectPlace: (target: PlannerTarget, place: PlaceSuggestion) => void;
  onClearPoint: (target: PlannerTarget) => void;
  onUseCurrentLocation: () => void;
  onSwap: () => void;
  onCompare: () => void;
}

export function JourneyPlanner({
  origin,
  destination,
  isLocating,
  isComparing,
  travelMode,
  onSelectTravelMode,
  onSelectPlace,
  onClearPoint,
  onUseCurrentLocation,
  onSwap,
  onCompare,
}: JourneyPlannerProps) {
  const { t } = useTranslation('safety');

  return (
    <SectionCard
      title={t('planner.title')}
      subtitle={t('planner.subtitle')}
      icon="map-marker-path"
      testID="planner-card"
    >
        <View style={styles.inputs}>
            <PlaceSearchField
              label={t('planner.start')}
              icon="record-circle-outline"
              testID="planner-origin"
              value={origin?.label ?? ''}
              placeholder={t('planner.searchPlaceholder')}
              onSelect={(place) => onSelectPlace('origin', place)}
              onClear={() => onClearPoint('origin')}
            />
            <PlaceSearchField
              label={t('planner.end')}
              icon="map-marker-check-outline"
              testID="planner-destination"
              value={destination?.label ?? ''}
              placeholder={t('planner.searchPlaceholder')}
              onSelect={(place) => onSelectPlace('destination', place)}
              onClear={() => onClearPoint('destination')}
            />
        </View>

        <View style={styles.actions}>
          <Button mode="text" icon="crosshairs-gps" loading={isLocating} onPress={onUseCurrentLocation}>
            {t('planner.useMyLocation')}
          </Button>
          <IconButton
            icon="swap-vertical"
            mode="outlined"
            size={18}
            accessibilityLabel={t('planner.swap')}
            disabled={!origin && !destination}
            onPress={onSwap}
          />
        </View>

        <SegmentedButtons
          value={travelMode}
          onValueChange={(mode) => onSelectTravelMode(mode as TravelMode)}
          density="small"
          buttons={[
            { value: 'walking', label: t('planner.walking'), icon: 'walk' },
            { value: 'driving', label: t('planner.driving'), icon: 'car' },
          ]}
        />

        <Text variant="bodySmall" style={styles.hint}>{t('planner.hint')}</Text>

        <Button
          mode="contained"
          icon="directions"
          loading={isComparing}
          disabled={!origin || !destination || isComparing}
          onPress={onCompare}
        >
          {t('planner.compare')}
        </Button>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  // Full width: the inputs hold place names, which are long.
  inputs: { gap: tokens.spacing.sm },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hint: { color: tokens.colors.textSecondary },
});
