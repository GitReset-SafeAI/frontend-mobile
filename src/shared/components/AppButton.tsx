import { StyleSheet } from 'react-native';
import { Button, type ButtonProps } from 'react-native-paper';

import { tokens } from '../theme/tokens';

// One button size app-wide: every action is at least 56dp tall, comfortably above the 48dp minimum.
export function AppButton({ contentStyle, labelStyle, ...props }: ButtonProps) {
  return (
    <Button
      {...props}
      style={[styles.button, props.mode === 'outlined' && styles.outlined, props.style]}
      contentStyle={[styles.content, contentStyle]}
      labelStyle={[styles.label, props.mode === 'text' && styles.textLabel, labelStyle]}
      buttonColor={props.buttonColor ?? (props.mode === 'contained' ? tokens.colors.navy : undefined)}
      textColor={props.textColor ?? (props.mode === 'contained' ? tokens.colors.textOnDark : tokens.colors.navy)}
    />
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: tokens.radii.pill },
  outlined: { borderColor: tokens.colors.navy, borderWidth: 2 },
  content: { minHeight: 56, paddingHorizontal: tokens.spacing.lg },
  label: { fontSize: tokens.typography.body.fontSize, fontWeight: '600' },
  textLabel: { color: tokens.colors.navy },
});
