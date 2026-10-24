import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';

import type { TimePeriodFilter } from '../../../services/contracts';
import { tokens } from '../../../shared/theme/tokens';

interface TimePeriodSelectorProps {
  value: TimePeriodFilter;
  // The period the device clock is in, marked so the default is not mistaken
  // for an arbitrary choice.
  currentPeriod: TimePeriodFilter;
  onChange: (value: TimePeriodFilter) => void;
}

// Her reported_time vocabulary has six values plus "any", too many for
// segmented buttons, so these scroll horizontally like a filter row.
const periods: TimePeriodFilter[] = [
  'all', 'morning', 'afternoon', 'evening', 'night', 'late_night', 'not_sure',
];

export function TimePeriodSelector({ value, currentPeriod, onChange }: TimePeriodSelectorProps) {
  const { t } = useTranslation('safety');
  return (
    <View style={styles.container}>
      <Text variant="labelLarge" style={styles.label}>{t('timePeriod.label')}</Text>
      <Text variant="bodySmall" style={styles.hint}>
        {t('timePeriod.defaultedToNow', { period: t(`timePeriod.${currentPeriod}`) })}
      </Text>
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
            {period === currentPeriod
              ? t('timePeriod.nowLabel', { period: t(`timePeriod.${period}`) })
              : t(`timePeriod.${period}`)}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: tokens.spacing.sm },
  label: { color: tokens.colors.textPrimary },
  hint: { color: tokens.colors.textSecondary },
  row: { gap: tokens.spacing.xs, paddingRight: tokens.spacing.md },
  selected: { backgroundColor: tokens.colors.lightTint },
});
