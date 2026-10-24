import { configureFonts, MD3LightTheme, type MD3Theme } from 'react-native-paper';

import { tokens } from './tokens';

export const theme: MD3Theme = {
  ...MD3LightTheme,
  dark: false,
  roundness: tokens.radii.sm,
  colors: {
    primary: tokens.colors.navy,
    onPrimary: tokens.colors.textOnDark,
    primaryContainer: tokens.colors.mintLight,
    onPrimaryContainer: tokens.colors.textPrimary,
    secondary: tokens.colors.navy,
    onSecondary: tokens.colors.textOnDark,
    secondaryContainer: tokens.colors.mintLight,
    onSecondaryContainer: tokens.colors.textPrimary,
    tertiary: tokens.colors.navy,
    onTertiary: tokens.colors.textOnDark,
    tertiaryContainer: tokens.colors.mintSoft,
    onTertiaryContainer: tokens.colors.textPrimary,
    background: tokens.colors.screenBackground,
    surface: tokens.colors.surface,
    // Paper flat inputs use surfaceVariant; keep their background white too.
    surfaceVariant: tokens.colors.surface,
    onBackground: tokens.colors.textPrimary,
    onSurface: tokens.colors.textPrimary,
    // Paper uses onSurfaceVariant for input placeholders and inactive labels.
    onSurfaceVariant: tokens.colors.textSecondary,
    // Functional control outlines need more contrast than decorative borders.
    outline: tokens.colors.textSecondary,
    outlineVariant: tokens.colors.border,
    surfaceDisabled: tokens.colors.disabled,
    onSurfaceDisabled: tokens.colors.textPrimary,
    error: tokens.colors.status.error,
    onError: tokens.colors.textOnDark,
    errorContainer: tokens.colors.status.errorContainer,
    onErrorContainer: tokens.colors.status.error,
    inverseSurface: tokens.colors.textPrimary,
    inverseOnSurface: tokens.colors.textOnDark,
    inversePrimary: tokens.colors.mintLight,
    shadow: tokens.colors.textPrimary,
    scrim: tokens.colors.textPrimary,
    backdrop: `${tokens.colors.textPrimary}66`,
    elevation: {
      level0: 'transparent',
      level1: tokens.colors.surface,
      level2: tokens.colors.surface,
      level3: tokens.colors.surface,
      level4: tokens.colors.surface,
      level5: tokens.colors.surface,
    },
  },
  fonts: configureFonts({
    config: {
      headlineMedium: tokens.typography.title,
      bodyLarge: tokens.typography.body,
      labelLarge: tokens.typography.label,
    },
  }),
};
