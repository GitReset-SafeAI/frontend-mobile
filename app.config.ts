import type { ExpoConfig } from 'expo/config';

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
      backgroundColor: '#E6F4FE',
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
