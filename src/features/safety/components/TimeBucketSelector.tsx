import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SegmentedButtons, Text } from 'react-native-paper';

import type { TimeBucketFilter } from '../../../services/contracts';
import { tokens } from '../../../shared/theme/tokens';

interface TimeBucketSelectorProps {
  value: TimeBucketFilter;
  onChange: (value: TimeBucketFilter) => void;
}

export function TimeBucketSelector({ value, onChange }: TimeBucketSelectorProps) {
  const { t } = useTranslation('safety');
  return (
    <View style={styles.container}>
      <Text variant="labelLarge" style={styles.label}>{t('timeBucket.label')}</Text>
      <SegmentedButtons
        value={value}
        onValueChange={(next) => onChange(next as TimeBucketFilter)}
        density="small"
        buttons={[
          { value: 'all', label: t('timeBucket.all') },
          { value: 'day', label: t('timeBucket.day') },
          { value: 'evening', label: t('timeBucket.evening') },
          { value: 'night', label: t('timeBucket.night') },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: tokens.spacing.sm },
  label: { color: tokens.colors.textPrimary },
});
