import { StatusBar } from 'expo-status-bar';

import { AppProviders } from './src/app/AppProviders';
import { RootNavigator } from './src/app/navigation/RootNavigator';

export default function App() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <RootNavigator />
    </AppProviders>
  );
}
