import { type NavigationProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

import type { RootStackParamList } from '../../../app/navigation/navigation.types';
import { tokens } from '../../../shared/theme/tokens';

// Compact emergency exit shown in every screen header, so help is never more than one tap away.
export function SosPill() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('sosHeaderLabel')}
      onPress={() => { navigation.navigate('Sos'); }}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
    >
      <Text style={styles.label} maxFontSizeMultiplier={1.3}>SOS</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    minWidth: tokens.touchTarget,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radii.pill,
    backgroundColor: tokens.colors.sos,
  },
  pressed: { backgroundColor: tokens.colors.sosPressed },
  label: { color: tokens.colors.textOnDark, fontWeight: '800', letterSpacing: 1 },
});
