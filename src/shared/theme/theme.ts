import { configureFonts, MD3LightTheme } from 'react-native-paper';

import { tokens } from './tokens';

export const theme = {
  ...MD3LightTheme,
  roundness: tokens.radii.sm,
  colors: {
    ...MD3LightTheme.colors,
    primary: tokens.colors.primary,
    onPrimary: tokens.colors.onPrimary,
    primaryContainer: tokens.colors.primaryContainer,
    onPrimaryContainer: tokens.colors.onPrimaryContainer,
    secondary: tokens.colors.secondary,
    onSecondary: tokens.colors.onSecondary,
    secondaryContainer: tokens.colors.secondaryContainer,
    onSecondaryContainer: tokens.colors.onSecondaryContainer,
    background: tokens.colors.background,
    surface: tokens.colors.surface,
    onBackground: tokens.colors.text,
    onSurface: tokens.colors.text,
    onSurfaceVariant: tokens.colors.textMuted,
    outline: tokens.colors.outline,
    error: tokens.colors.status.error,
  },
  fonts: configureFonts({
    config: {
      headlineMedium: tokens.typography.title,
      bodyLarge: tokens.typography.body,
      labelLarge: tokens.typography.label,
    },
  }),
};
