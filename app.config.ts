import type { ExpoConfig } from 'expo/config';

// Build-time only. The Android Google Maps key is restricted by package name
// and SHA-1 in the Google Cloud console; it is not a secret credential, but it
// is kept out of version control all the same.
const androidMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? '';

const config: ExpoConfig = {
  name: 'SafeStep',
  slug: 'safestep',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: { supportsTablet: true },
  android: {
    adaptiveIcon: {
      backgroundColor: '#FEFCF7',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    config: androidMapsApiKey ? { googleMaps: { apiKey: androidMapsApiKey } } : undefined,
  },
  web: { favicon: './assets/favicon.png' },
  plugins: [
    'expo-font',
    'expo-asset',
    'expo-secure-store',
    ['expo-localization', { supportedLocales: { ios: ['en', 'si', 'ta'], android: ['en', 'si', 'ta'] } }],
    ['expo-audio', {
      microphonePermission: 'Allow SafeStep to record audio when you choose voice input.',
      enableBackgroundRecording: false,
      enableBackgroundPlayback: false,
    }],
    ['expo-location', {
      locationWhenInUsePermission: 'Allow SafeStep to use your location when you choose your current position or share it with an emergency contact.',
      isIosBackgroundLocationEnabled: false,
      isAndroidBackgroundLocationEnabled: false,
    }],
  ],
};

export default config;
