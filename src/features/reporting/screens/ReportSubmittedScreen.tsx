import { type NavigationProp, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Card, Icon, Text } from 'react-native-paper';

import type { ReportStackParamList, RootStackParamList } from '../../../app/navigation/navigation.types';
import { AppButton } from '../../../shared/components/AppButton';
import { InfoNote } from '../../../shared/components/InfoNote';
import { StepLayout } from '../../../shared/layouts/StepLayout';
import { tokens } from '../../../shared/theme/tokens';
import { AnalysisSummary } from '../../incident-ai';
import { useReportDraft } from '../reportDraft';

type Props = NativeStackScreenProps<ReportStackParamList, 'ReportSubmitted'>;

export function ReportSubmittedScreen({ navigation }: Props) {
  const { t } = useTranslation('reporting');
  const { t: tc } = useTranslation();
  const { draft, receipt, reset } = useReportDraft();
  const rootNavigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Clear the in-memory draft and leave a fresh form behind, then go to the requested tab.
  const finish = (destination: 'Home' | 'SafetyMap') => {
    reset();
    navigation.reset({ index: 0, routes: [{ name: 'ReportDescribe' }] });
    rootNavigation.navigate('MainTabs', { screen: destination });
  };

  return (
    <StepLayout
      title={receipt ? t('submitted.title') : t('submitted.empty')}
      subtitle={receipt ? t('submitted.subtitle') : undefined}
      footer={(
        <View style={styles.footer}>
          <AppButton mode="contained" onPress={() => { finish('Home'); }}>{tc('done')}</AppButton>
          <AppButton mode="outlined" icon="map-outline" onPress={() => { finish('SafetyMap'); }}>
            {t('submitted.viewMap')}
          </AppButton>
        </View>
      )}
    >
      {receipt ? (
        <>
          <View style={styles.success}>
            <Icon source="check-circle-outline" size={56} color={tokens.colors.status.success} />
          </View>

          <Card mode="outlined" style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text variant="labelLarge" style={styles.label}>{t('submitted.yourWords')}</Text>
              <Text variant="bodyLarge" style={styles.words}>{draft.description.trim()}</Text>
            </Card.Content>
          </Card>

          <AnalysisSummary analysis={receipt.analysis} />
          <InfoNote icon="shield-check-outline" text={t('submitted.next')} />
        </>
      ) : null}
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  footer: { flex: 1, gap: tokens.spacing.sm },
  success: { alignItems: 'flex-start' },
  card: { borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  cardContent: { gap: tokens.spacing.xs },
  label: { color: tokens.colors.textSecondary },
  words: { color: tokens.colors.textPrimary },
});
