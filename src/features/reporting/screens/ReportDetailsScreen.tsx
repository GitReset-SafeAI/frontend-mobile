import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { ReportStackParamList } from '../../../app/navigation/navigation.types';
import { AppButton } from '../../../shared/components/AppButton';
import { ChoiceGroup } from '../../../shared/components/ChoiceGroup';
import { StepLayout } from '../../../shared/layouts/StepLayout';
import { tokens } from '../../../shared/theme/tokens';
import type { CrowdLevel, LightingLevel, NearbyAnswer } from '../../../services/contracts';
import { crowdLevels, lightingLevels, nearbyAnswers } from '../../../services/contracts/incident';
import { useReportDraft } from '../reportDraft';

type Props = NativeStackScreenProps<ReportStackParamList, 'ReportDetails'>;

export function ReportDetailsScreen({ navigation }: Props) {
  const { t } = useTranslation('reporting');
  const { t: tc } = useTranslation();
  const { draft, update } = useReportDraft();
  const answered = Boolean(draft.lighting || draft.crowd || draft.othersNearby);

  return (
    <StepLayout
      step={{ current: 3, total: 3 }}
      title={t('details.title')}
      subtitle={t('details.subtitle')}
      footer={(
        <>
          <AppButton mode="outlined" style={styles.flex} onPress={() => { navigation.goBack(); }}>{tc('back')}</AppButton>
          <AppButton mode="contained" style={styles.flex} onPress={() => { navigation.navigate('ReportReview'); }}>
            {answered ? tc('next') : tc('skip')}
          </AppButton>
        </>
      )}
    >
      <View style={styles.groups}>
        <ChoiceGroup<LightingLevel>
          label={t('details.lighting')}
          options={lightingLevels.map((value) => ({ value, label: t(`details.lightingOptions.${value}`) }))}
          value={draft.lighting}
          onChange={(lighting) => { update({ lighting }); }}
        />
        <ChoiceGroup<CrowdLevel>
          label={t('details.crowd')}
          options={crowdLevels.map((value) => ({ value, label: t(`details.crowdOptions.${value}`) }))}
          value={draft.crowd}
          onChange={(crowd) => { update({ crowd }); }}
        />
        <ChoiceGroup<NearbyAnswer>
          label={t('details.others')}
          options={nearbyAnswers.map((value) => ({ value, label: t(`details.othersOptions.${value}`) }))}
          value={draft.othersNearby}
          onChange={(othersNearby) => { update({ othersNearby }); }}
        />
      </View>
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  groups: { gap: tokens.spacing.lg },
});
