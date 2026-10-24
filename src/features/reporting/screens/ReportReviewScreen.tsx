import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import type { ReportStackParamList } from '../../../app/navigation/navigation.types';
import { AppButton } from '../../../shared/components/AppButton';
import { InfoNote } from '../../../shared/components/InfoNote';
import { StepLayout } from '../../../shared/layouts/StepLayout';
import { tokens } from '../../../shared/theme/tokens';
import { reportSubmissionSchema } from '../../../services/contracts/incident';
import { useSubmitReport } from '../hooks/useSubmitReport';
import { toSubmission, useReportDraft } from '../reportDraft';

type Props = NativeStackScreenProps<ReportStackParamList, 'ReportReview'>;

function SummarySection({ title, editLabel, onEdit, children }: {
  title: string;
  editLabel: string;
  onEdit: () => void;
  children: string[];
}) {
  return (
    <Card mode="outlined" style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={styles.cardTitle} accessibilityRole="header">{title}</Text>
          <AppButton mode="text" compact accessibilityLabel={`${editLabel}: ${title}`} onPress={onEdit}>{editLabel}</AppButton>
        </View>
        {children.map((line) => <Text key={line} variant="bodyLarge" style={styles.line}>{line}</Text>)}
      </Card.Content>
    </Card>
  );
}

export function ReportReviewScreen({ navigation }: Props) {
  const { t } = useTranslation('reporting');
  const { t: tc } = useTranslation();
  const { draft, setReceipt } = useReportDraft();
  const submit = useSubmitReport();
  const parsed = reportSubmissionSchema.safeParse(toSubmission(draft));
  const notProvided = t('review.notProvided');

  const whenWhere = [
    draft.occurredWhen ? t(`when.options.${draft.occurredWhen}`) : undefined,
    draft.location
      ? (draft.location.source === 'device' || !draft.location.districtId
        ? t('when.selectedCurrent')
        : t('when.selectedDistrict', { district: t(`districts.${draft.location.districtId}`) }))
      : undefined,
  ].filter((line): line is string => Boolean(line));

  const extra = [
    draft.lighting ? `${t('details.lighting')}: ${t(`details.lightingOptions.${draft.lighting}`)}` : undefined,
    draft.crowd ? `${t('details.crowd')} ${t(`details.crowdOptions.${draft.crowd}`)}` : undefined,
    draft.othersNearby ? `${t('details.others')} ${t(`details.othersOptions.${draft.othersNearby}`)}` : undefined,
  ].filter((line): line is string => Boolean(line));

  const onSubmit = () => {
    if (!parsed.success) return;
    submit.mutate(parsed.data, {
      onSuccess: (receipt) => {
        setReceipt(receipt);
        // Reset the stack so Back can never return to the form and submit the same report twice.
        navigation.reset({ index: 0, routes: [{ name: 'ReportSubmitted' }] });
      },
    });
  };

  return (
    <StepLayout
      title={t('review.title')}
      subtitle={t('review.subtitle')}
      footer={(
        <>
          <AppButton mode="outlined" style={styles.flex} disabled={submit.isPending} onPress={() => { navigation.goBack(); }}>
            {tc('back')}
          </AppButton>
          <AppButton
            mode="contained"
            style={styles.flex}
            loading={submit.isPending}
            disabled={submit.isPending || !parsed.success}
            onPress={onSubmit}
          >
            {t('review.submit')}
          </AppButton>
        </>
      )}
    >
      {!parsed.success ? <InfoNote tone="error" icon="alert-circle-outline" text={t('review.invalid')} /> : null}
      {submit.isError ? (
        <InfoNote tone="error" icon="alert-circle-outline" text={`${t('review.errorTitle')}. ${t('review.errorBody')}`} />
      ) : null}
      {submit.isPending ? (
        <View accessibilityLiveRegion="polite"><InfoNote icon="timer-sand" text={t('review.submitting')} /></View>
      ) : null}

      <SummarySection title={t('review.what')} editLabel={tc('edit')} onEdit={() => { navigation.navigate('ReportDescribe'); }}>
        {[draft.description.trim() || notProvided]}
      </SummarySection>
      <SummarySection title={t('review.whenWhere')} editLabel={tc('edit')} onEdit={() => { navigation.navigate('ReportWhen'); }}>
        {whenWhere.length ? whenWhere : [notProvided]}
      </SummarySection>
      <SummarySection title={t('review.extra')} editLabel={tc('edit')} onEdit={() => { navigation.navigate('ReportDetails'); }}>
        {extra.length ? extra : [notProvided]}
      </SummarySection>

      <View style={styles.notes}>
        <InfoNote icon="lock-outline" text={t('review.privacy')} />
        <InfoNote icon="robot-outline" text={t('review.aiNote')} />
      </View>
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  cardContent: { gap: tokens.spacing.xs },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { flex: 1, color: tokens.colors.navy },
  line: { color: tokens.colors.textPrimary },
  notes: { gap: tokens.spacing.sm },
});
