import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { tokens } from '../theme/tokens';

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
}

interface ChoiceGroupProps<T extends string> {
  label: string;
  options: readonly ChoiceOption<T>[];
  value: T | undefined;
  // Selecting the chosen option again clears it, so optional answers are always reversible.
  onChange: (value: T | undefined) => void;
}

export function ChoiceGroup<T extends string>({ label, options, value, onChange }: ChoiceGroupProps<T>) {
  return (
    <View style={styles.group}>
      <Text variant="titleMedium" style={styles.label} accessibilityRole="header">{label}</Text>
      <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ checked: selected }}
              onPress={() => { onChange(selected ? undefined : option.value); }}
              style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.chipPressed]}
            >
              {/* Selection is shown by an icon and a heavier border, never by colour alone. */}
              {selected ? <Icon source="check" size={18} color={tokens.colors.textPrimary} /> : null}
              <Text variant="labelLarge" style={styles.chipLabel}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: tokens.spacing.sm },
  label: { color: tokens.colors.textPrimary },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm },
  chip: {
    minHeight: tokens.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radii.pill,
    borderWidth: 1,
    borderColor: tokens.colors.textSecondary,
    backgroundColor: tokens.colors.surface,
  },
  chipSelected: { borderWidth: 2, borderColor: tokens.colors.navy, backgroundColor: tokens.colors.mintLight },
  chipPressed: { opacity: 0.7 },
  chipLabel: { color: tokens.colors.textPrimary },
});
