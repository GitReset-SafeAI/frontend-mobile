import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AuthScreen, KeepContactsWarm } from '../../features/account';
import { useAuth } from '../../features/account/authContext';
import { SosScreen } from '../../features/emergency';
import { BrandFullLogo } from '../../shared/components/Brand';
import { tokens } from '../../shared/theme/tokens';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './navigation.types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: tokens.colors.navy,
    background: tokens.colors.screenBackground,
    card: tokens.colors.surface,
    text: tokens.colors.textPrimary,
    border: tokens.colors.border,
    notification: tokens.colors.status.error,
  },
};

// Shown for the instant it takes to read the saved session, so a signed-in person never sees the login screen flash.
function LoadingScreen() {
  const { t } = useTranslation();
  return (
    <View style={styles.loading} testID="auth-loading" accessibilityLiveRegion="polite">
      <BrandFullLogo name={t('appName')} width={160} />
      <ActivityIndicator color={tokens.colors.navy} />
    </View>
  );
}

export function RootNavigator() {
  const { status, user, guest } = useAuth();
  if (status === 'loading') return <LoadingScreen />;

  // Signed out and not browsing as a guest: the first thing to see is login / sign up. Either way ends on Home.
  const signedOut = !user && !guest;
  return (
    <NavigationContainer theme={navigationTheme}>
      {user ? <KeepContactsWarm /> : null}
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {signedOut ? (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ animationTypeForReplace: 'pop' }} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            {/* Full-screen and gesture-free: leaving is an explicit Cancel/Close, or Android Back. */}
            <Stack.Screen
              name="Sos"
              component={SosScreen}
              options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.lg, backgroundColor: tokens.colors.screenBackground },
});
