import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import type { ReportStackParamList } from '../../app/navigation/navigation.types';
import { tokens } from '../../shared/theme/tokens';
import { SosPill } from '../emergency';
import { ReportDraftProvider } from './reportDraft';
import { ReportDescribeScreen } from './screens/ReportDescribeScreen';
import { ReportDetailsScreen } from './screens/ReportDetailsScreen';
import { ReportReviewScreen } from './screens/ReportReviewScreen';
import { ReportSubmittedScreen } from './screens/ReportSubmittedScreen';
import { ReportWhenScreen } from './screens/ReportWhenScreen';

const Stack = createNativeStackNavigator<ReportStackParamList>();
const renderSos = () => <SosPill />;

// Describe -> When/where -> Details -> Review -> Submitted. The draft lives above the stack so it
// survives switching tabs mid-report, and is cleared on Done or Start over.
export function ReportNavigator() {
  const { t } = useTranslation('reporting');
  return (
    <ReportDraftProvider>
      <Stack.Navigator
        screenOptions={{
          title: t('headerTitle'),
          headerRight: renderSos,
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: tokens.colors.navy,
          headerTitleStyle: { color: tokens.colors.textPrimary },
          headerStyle: { backgroundColor: tokens.colors.surface },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: tokens.colors.screenBackground },
        }}
      >
        <Stack.Screen name="ReportDescribe" component={ReportDescribeScreen} />
        <Stack.Screen name="ReportWhen" component={ReportWhenScreen} />
        <Stack.Screen name="ReportDetails" component={ReportDetailsScreen} />
        <Stack.Screen name="ReportReview" component={ReportReviewScreen} />
        <Stack.Screen
          name="ReportSubmitted"
          component={ReportSubmittedScreen}
          options={{ headerBackVisible: false, gestureEnabled: false }}
        />
      </Stack.Navigator>
    </ReportDraftProvider>
  );
}
