import { StyleSheet } from 'react-native';
import { Button, type ButtonProps } from 'react-native-paper';

import { tokens } from '../theme/tokens';

// One button size app-wide: every action is at least 56dp tall, comfortably above the 48dp minimum.
export function AppButton({ contentStyle, labelStyle, ...props }: ButtonProps) {
  return <Button {...props} contentStyle={[styles.content, contentStyle]} labelStyle={[styles.label, labelStyle]} />;
}

const styles = StyleSheet.create({
  content: { minHeight: 56 },
  label: { fontSize: tokens.typography.body.fontSize, fontWeight: '600' },
});
