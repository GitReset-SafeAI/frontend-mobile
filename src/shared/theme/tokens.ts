const white = '#FFFFFF';

const colors = {
  // Supplied brand palette. Medium purples are decorative, not text surfaces.
  backgroundLavender: '#A084B8',
  primary: '#8B5BA7',
  primaryDark: '#7B3FB5',
  accentCircle: '#9B6FD6',
  softCircle: '#8E78C4',
  lightTint: '#D8CCF5',
  homeGradientStart: '#E8DDF7',
  homeGradientEnd: '#A56FD8',
  surface: white,
  textOnDark: white,
  inputHint: '#B8B8B8', // Decorative hints/dividers only; not readable input text.
  deviceBezel: '#000000', // Mockups only; never a UI background or shadow.

  screenBackground: '#FAF7FC',
  textPrimary: '#30243A',
  textSecondary: '#6F6478',
  border: '#E8E0EE', // Subtle panel boundaries; not the sole control affordance.
  disabled: '#B8A9C5',
  status: {
    info: '#245A89',
    success: '#25633C',
    warning: '#785500',
    error: '#A62532',
    errorContainer: '#FCE8EB',
    unknown: '#535E68',
  },
} as const;

export type ColorTokens = typeof colors;
export type StatusColorToken = keyof ColorTokens['status'];

export const tokens = {
  colors,
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radii: { sm: 8, md: 16, lg: 24 },
  typography: {
    title: { fontSize: 28, lineHeight: 40 },
    body: { fontSize: 16, lineHeight: 28 },
    label: { fontSize: 14, lineHeight: 24 },
  },
} as const;
