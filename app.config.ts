import type { ExpoConfig } from 'expo/config';

// Expo compiles only this config file. Node 24 loads shared TS via an explicit extension.
const { tokens }: typeof import('./src/shared/theme/tokens') = require('./src/shared/theme/tokens.ts');

const config: ExpoConfig = {
  name: 'SafeRoute AI',
  slug: 'saferoute-ai',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: { supportsTablet: true },
  android: {
    adaptiveIcon: {
      backgroundColor: tokens.colors.screenBackground,
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: { favicon: './assets/favicon.png' },
  plugins: [
    'expo-font',
    'expo-asset',
    ['expo-localization', { supportedLocales: { ios: ['en', 'si'], android: ['en', 'si'] } }],
    ['expo-audio', {
      microphonePermission: 'Allow SafeRoute AI to record audio when you choose voice input.',
      enableBackgroundRecording: false,
      enableBackgroundPlayback: false,
    }],
    ['expo-location', {
      locationWhenInUsePermission: 'Allow SafeRoute AI to use your location when you choose your current position.',
      isIosBackgroundLocationEnabled: false,
      isAndroidBackgroundLocationEnabled: false,
    }],
  ],
};

export default config;
