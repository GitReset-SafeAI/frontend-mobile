import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from 'react-native-paper';

import { tokens } from '../../../shared/theme/tokens';
import { SOS_COUNTDOWN_SECONDS } from '../sos';

interface SosButtonProps {
  onPress: () => void;
}

// The one dominant control on the home screen. Concentric rings make it unmistakable
// without animation or clutter.
export function SosButton({ onPress }: SosButtonProps) {
  const { t } = useTranslation('emergency');
  const { width, height } = useWindowDimensions();
  const size = Math.min(width * 0.58, height * 0.3, 280);
  const inner = size * 1.18;
  const outer = size * 1.42;

  return (
    <View style={[styles.ring, { width: outer, height: outer, borderRadius: outer / 2, backgroundColor: tokens.colors.sosRingOuter }]}>
      <View style={[styles.ring, { width: inner, height: inner, borderRadius: inner / 2, backgroundColor: tokens.colors.sosRingInner }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('sosA11yLabel')}
          accessibilityHint={t('sosA11yHint', { seconds: SOS_COUNTDOWN_SECONDS })}
          onPress={onPress}
          style={({ pressed }) => [
            styles.button,
            { width: size, height: size, borderRadius: size / 2 },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.label, { fontSize: size * 0.3 }]} maxFontSizeMultiplier={1.2}>{t('sosLabel')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { alignItems: 'center', justifyContent: 'center' },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.sos,
    elevation: 6,
    shadowColor: tokens.colors.sos,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  pressed: { backgroundColor: tokens.colors.sosPressed, transform: [{ scale: 0.97 }] },
  label: { color: tokens.colors.textOnDark, fontWeight: '800', letterSpacing: 2 },
});
