const white = '#FFFFFF';

const colors = {
  // SafeStep brand palette (same roles as the web app). Contrast was checked against the real pairings:
  // navy carries text, primary actions and selection outlines; mint is a calm supporting surface and never
  // text; coral is the warm accent and is never used for text or for a surface with white text on it.
  navy: '#133148',
  mint: '#8CC1B2',
  mintLight: '#D5EAE3', // Selected states and tinted containers; navy text on it is 10.7:1.
  mintSoft: '#EAF4F0', // Quiet note and hero washes.
  coral: '#E9736B', // Accent only: white on coral is 2.95:1, navy on coral 4.57:1.
  // Darker shades of the same hues, for places where the colour itself must be seen against white or a map
  // tile (icons, outlines, count labels): 4.9:1 and 4.5:1 on white. Never used as a text colour on mint or coral.
  coralDeep: '#AF5650',
  mintDeep: '#5B7D74',

  // Earlier names, kept so existing screens (including the safety map) pick up the new palette unchanged.
  // Prefer the brand names above in new code.
  primary: '#133148', // navy
  primaryDark: '#133148', // navy
  lightTint: '#D5EAE3', // mintLight
  homeGradientStart: '#EAF4F0', // mintSoft

  surface: white,
  textOnDark: white,

  screenBackground: '#FEFCF7',
  textPrimary: '#133148',
  textSecondary: '#4A5C6C', // 6.9:1 on white, 6.7:1 on the screen background.
  border: '#DCD8CB', // Subtle panel boundaries; not the sole control affordance.
  disabled: '#A9B4BD',
  status: {
    info: '#245A89',
    success: '#25633C',
    warning: '#785500',
    error: '#A62532',
    errorContainer: '#FCE8EB',
    unknown: '#535E68',
  },

  // Emergency. White text on `sos` is 7.2:1. Red is reserved for SOS and errors, so it keeps its meaning.
  sos: '#A62532',
  sosPressed: '#851D28',
  sosRingInner: '#F9DCE0',
  sosRingOuter: '#FCEDEF',

  // The safety map. Reported areas use the coral accent (never red or green: a quiet area is not "safe",
  // and red stays reserved for SOS and errors). Routes are navy; the alternatives are a lighter slate navy.
  // The destination pin is coral, like the pin in the logo. Colour never carries meaning alone: every area
  // also shows its report count and issue types.
  map: {
    area: '#E9736B', // coral: fill (opacity follows intensity)
    areaOutline: '#AF5650', // coralDeep
    route: '#133148', // navy: the selected route
    routeAlternative: '#5B7C99', // slate navy: other routes, still visible on a map tile
    origin: '#133148', // navy
    destination: '#E9736B', // coral
    // Issue groups, for icons and count labels. Each has text beside it on screen.
    issueConduct: '#AF5650', // being followed, harassment, contact, threats
    issueBehaviour: '#133148', // staring and other conduct
    issueConcern: '#5B7D74', // lighting, isolated roads, bus stops
    issueUnknown: '#4A5C6C', // unclear or unrecognised
  },
} as const;

export type ColorTokens = typeof colors;
export type StatusColorToken = keyof ColorTokens['status'];

export const tokens = {
  colors,
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radii: { sm: 8, md: 16, lg: 24, pill: 999 },
  // Minimum touch target (dp). Emergency actions use `touchTargetLarge`.
  touchTarget: 48,
  touchTargetLarge: 64,
  typography: {
    title: { fontSize: 28, lineHeight: 40 },
    body: { fontSize: 16, lineHeight: 28 },
    label: { fontSize: 14, lineHeight: 24 },
  },
} as const;
