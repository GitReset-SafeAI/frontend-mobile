import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';

import type { TimePeriodFilter } from '../../../services/contracts';
import { tokens } from '../../../shared/theme/tokens';

interface TimePeriodSelectorProps {
  value: TimePeriodFilter;
  onChange: (value: TimePeriodFilter) => void;
}

// Her reported_time vocabulary has six values plus "any", too many for
// segmented buttons, so these scroll horizontally like a filter row.
const periods: TimePeriodFilter[] = [
  'all', 'morning', 'afternoon', 'evening', 'night', 'late_night', 'not_sure',
];

export function TimePeriodSelector({ value, onChange }: TimePeriodSelectorProps) {
  const { t } = useTranslation('safety');
  return (
    <View style={styles.container}>
      <Text variant="labelLarge" style={styles.label}>{t('timePeriod.label')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {periods.map((period) => (
          <Chip
            key={period}
            selected={value === period}
            showSelectedCheck={false}
            onPress={() => onChange(period)}
            accessibilityState={{ selected: value === period }}
            style={value === period ? styles.selected : undefined}
          >
            {t(`timePeriod.${period}`)}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: tokens.spacing.sm },
  label: { color: tokens.colors.textPrimary },
  row: { gap: tokens.spacing.xs, paddingRight: tokens.spacing.md },
  selected: { backgroundColor: tokens.colors.lightTint },
});
