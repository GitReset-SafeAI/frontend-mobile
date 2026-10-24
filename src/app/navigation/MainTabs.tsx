import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { Icon } from 'react-native-paper';

import { ReportScreen } from '../../features/reporting';
import { SafetyMapScreen } from '../../features/safety';
import { tokens } from '../../shared/theme/tokens';
import type { MainTabParamList } from './navigation.types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: tokens.colors.primaryDark,
      tabBarInactiveTintColor: tokens.colors.textSecondary,
      tabBarStyle: { backgroundColor: tokens.colors.surface, borderTopColor: tokens.colors.border },
      tabBarIcon: ({ color, size }) => (
        <Icon source={route.name === 'Report' ? 'clipboard-text-outline' : 'map-outline'} color={color} size={size} />
      ),
    })}>
      <Tab.Screen name="Report" component={ReportScreen} options={{
        title: t('reportTab'),
        tabBarAccessibilityLabel: t('reportTabAccessibility'),
      }} />
      <Tab.Screen name="SafetyMap" component={SafetyMapScreen} options={{
        title: t('safetyTab'),
        tabBarAccessibilityLabel: t('safetyTabAccessibility'),
      }} />
    </Tab.Navigator>
  );
}
