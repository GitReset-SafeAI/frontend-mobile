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

// Native map and location modules are outside the JS rendering tests.
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { Pressable, View } = require('react-native');
  const stub = (name: string) =>
    function MapStub(props: Record<string, unknown>) {
      return React.createElement(View, { testID: name, ...props }, props.children as never);
    };
  // MapView is a Pressable stub so map taps can be exercised in tests.
  function MapViewStub(props: Record<string, unknown>) {
    return React.createElement(Pressable, { testID: 'MapView', ...props }, props.children as never);
  }
  return {
    __esModule: true,
    default: MapViewStub,
    Marker: stub('Marker'),
    Circle: stub('Circle'),
    Polyline: stub('Polyline'),
  };
});

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: jest.fn(async () => ({ granted: false })),
  getCurrentPositionAsync: jest.fn(async () => ({ coords: { latitude: 0, longitude: 0 } })),
}));

// Secure storage is native. An in-memory stand-in keeps the demo account tests deterministic, and every test
// starts with nothing stored.
const mockSecureStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockSecureStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => { mockSecureStore.set(key, value); }),
  deleteItemAsync: jest.fn(async (key: string) => { mockSecureStore.delete(key); }),
}));
beforeEach(() => { mockSecureStore.clear(); });
