import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { Icon } from 'react-native-paper';

import { AccountScreen } from '../../features/account';
import { HomeScreen, SosPill } from '../../features/emergency';
import { ReportNavigator } from '../../features/reporting';
import { SafetyMapScreen } from '../../features/safety';
import { tokens } from '../../shared/theme/tokens';
import type { MainTabParamList } from './navigation.types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const tabIcons: Record<keyof MainTabParamList, string> = {
  Home: 'home-variant-outline',
  Report: 'clipboard-text-outline',
  SafetyMap: 'map-outline',
  Account: 'account-circle-outline',
};
const renderSos = () => <SosPill />;

// Same header treatment for every tab that has one, so emergency help (the SOS pill) is one tap from anywhere.
const withSosHeader = (title: string) => ({
  headerShown: true,
  headerTitle: title,
  headerRight: renderSos,
  headerRightContainerStyle: { paddingRight: tokens.spacing.md },
  headerShadowVisible: false,
  headerTitleStyle: { color: tokens.colors.textPrimary },
  headerStyle: { backgroundColor: tokens.colors.surface },
});

// Four destinations, always visible. Home (the SOS button) is the landing tab. The Safety Map screen is
// unchanged: it only gains the shared header with the SOS pill.
export function MainTabs() {
  const { t } = useTranslation();
  const { t: ta } = useTranslation('account');
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: tokens.colors.navy,
        tabBarInactiveTintColor: tokens.colors.textSecondary,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: { backgroundColor: tokens.colors.surface, borderTopColor: tokens.colors.border },
        tabBarIcon: ({ color, size }) => <Icon source={tabIcons[route.name]} color={color} size={size} />,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: t('homeTab'), tabBarAccessibilityLabel: t('homeTabAccessibility') }}
      />
      <Tab.Screen
        name="Report"
        component={ReportNavigator}
        options={{ title: t('reportTabNew'), tabBarAccessibilityLabel: t('reportTabNewAccessibility') }}
      />
      <Tab.Screen
        name="SafetyMap"
        component={SafetyMapScreen}
        options={{
          title: t('safetyTab'),
          tabBarAccessibilityLabel: t('safetyTabAccessibility'),
          ...withSosHeader(t('safetyTab')),
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          title: ta('nav.account'),
          tabBarAccessibilityLabel: ta('nav.accountTabA11y'),
          ...withSosHeader(ta('nav.account')),
        }}
      />
    </Tab.Navigator>
  );
}
