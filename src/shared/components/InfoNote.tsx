import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { tokens } from '../theme/tokens';

interface InfoNoteProps {
  text: string;
  icon?: string;
  tone?: 'neutral' | 'error';
}

// Short, quiet explanatory text. Tone is always paired with an icon, never colour alone.
export function InfoNote({ text, icon = 'information-outline', tone = 'neutral' }: InfoNoteProps) {
  const error = tone === 'error';
  return (
    <View style={[styles.note, error && styles.error]} accessibilityRole={error ? 'alert' : undefined}>
      <Icon source={icon} size={20} color={error ? tokens.colors.status.error : tokens.colors.navy} />
      <Text variant="bodyMedium" style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.sm,
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.sm,
    backgroundColor: tokens.colors.mintSoft,
  },
  error: { backgroundColor: tokens.colors.status.errorContainer },
  text: { flex: 1, color: tokens.colors.textPrimary },
});
