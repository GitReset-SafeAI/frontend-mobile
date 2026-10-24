import { Image, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { tokens } from '../theme/tokens';

// The mark is the supplied logo artwork. The wordmark is live text so it stays sharp and scales with the
// user's font size; the coral "Step" is part of the logotype only (coral text fails contrast elsewhere).
const mark = require('../../../assets/logo-mark.png');
const fullLogo = require('../../../assets/logo.png');

export function BrandMark({ height = 36 }: { height?: number }) {
  return <Image source={mark} style={{ height, width: height * 0.81 }} accessibilityIgnoresInvertColors />;
}

// Mark + wordmark on one line, for headers.
export function BrandLogo({ name }: { name: string }) {
  const split = name.length > 4 ? 4 : name.length;
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel={name}>
      <BrandMark />
      <Text style={styles.word} importantForAccessibility="no" accessibilityElementsHidden>
        {name.slice(0, split)}
        <Text style={styles.step}>{name.slice(split)}</Text>
      </Text>
    </View>
  );
}

// The full stacked logo, for sign-in and loading screens.
export function BrandFullLogo({ name, width = 200 }: { name: string; width?: number }) {
  return (
    <Image
      source={fullLogo}
      style={{ width, height: width * 0.926 }}
      accessibilityRole="image"
      accessibilityLabel={name}
      accessibilityIgnoresInvertColors
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  word: { color: tokens.colors.navy, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  step: { color: tokens.colors.coral },
});
