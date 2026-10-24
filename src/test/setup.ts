// Deterministic public settings only. No local .env files are read by tests.
process.env.EXPO_PUBLIC_DATA_MODE = 'mock';
process.env.EXPO_PUBLIC_API_BASE_URL = '';

jest.mock('react-native-safe-area-context', () =>
  jest.requireActual('react-native-safe-area-context/jest/mock').default);

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en', languageTag: 'en-LK' }],
}));

// Font assets/native loading are outside the JS rendering tests.
jest.mock('expo-font', () => ({
  isLoaded: () => true,
  isLoading: () => false,
  loadAsync: jest.fn(async () => undefined),
}));
