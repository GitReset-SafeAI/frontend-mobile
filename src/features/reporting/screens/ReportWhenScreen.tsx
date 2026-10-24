import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import type { ReportStackParamList } from '../../../app/navigation/navigation.types';
import { AppButton } from '../../../shared/components/AppButton';
import { ChoiceGroup } from '../../../shared/components/ChoiceGroup';
import { InfoNote } from '../../../shared/components/InfoNote';
import { StepLayout } from '../../../shared/layouts/StepLayout';
import { tokens } from '../../../shared/theme/tokens';
import { type ApproximateLocation, type IncidentTime } from '../../../services/contracts';
import { incidentTimes } from '../../../services/contracts/incident';
import { DistrictPicker } from '../components/DistrictPicker';
import { districts } from '../districts';
import { useApproximateLocation } from '../hooks/useApproximateLocation';
import { useReportDraft } from '../reportDraft';

type Props = NativeStackScreenProps<ReportStackParamList, 'ReportWhen'>;

export function ReportWhenScreen({ navigation }: Props) {
  const { t } = useTranslation('reporting');
  const { t: tc } = useTranslation();
  const { draft, update } = useReportDraft();
  const [pickerOpen, setPickerOpen] = useState(false);

  const onLocated = useCallback((location: ApproximateLocation) => { update({ location }); }, [update]);
  const { status, locate } = useApproximateLocation(onLocated);

  const timeOptions = incidentTimes.map((value) => ({ value, label: t(`when.options.${value}`) }));
  const answered = Boolean(draft.occurredWhen || draft.location);
  const location = draft.location;

  const selectDistrict = (id: string) => {
    const district = districts.find((entry) => entry.id === id);
    if (district) {
      update({ location: { latitude: district.latitude, longitude: district.longitude, source: 'district', districtId: id } });
    }
    setPickerOpen(false);
  };

  return (
    <StepLayout
      step={{ current: 2, total: 3 }}
      title={t('when.title')}
      subtitle={t('when.subtitle')}
      footer={(
        <>
          <AppButton mode="outlined" style={styles.flex} onPress={() => { navigation.goBack(); }}>{tc('back')}</AppButton>
          <AppButton mode="contained" style={styles.flex} onPress={() => { navigation.navigate('ReportDetails'); }}>
            {answered ? tc('next') : tc('skip')}
          </AppButton>
        </>
      )}
    >
      <ChoiceGroup<IncidentTime>
        label={t('when.whenLabel')}
        options={timeOptions}
        value={draft.occurredWhen}
        onChange={(occurredWhen) => { update({ occurredWhen }); }}
      />

      <View style={styles.where}>
        <Text variant="titleMedium" style={styles.heading} accessibilityRole="header">{t('when.whereLabel')}</Text>
        <Text variant="bodyMedium" style={styles.hint}>{t('when.whereHint')}</Text>

        {location ? (
          <View style={styles.selected}>
            <Icon source={location.source === 'device' ? 'crosshairs-gps' : 'map-marker-outline'} size={24} color={tokens.colors.navy} />
            <Text variant="bodyLarge" style={styles.selectedText}>
              {location.source === 'device' || !location.districtId
                ? t('when.selectedCurrent')
                : t('when.selectedDistrict', { district: t(`districts.${location.districtId}`) })}
            </Text>
            <AppButton mode="text" compact onPress={() => { update({ location: undefined }); }}>{t('when.remove')}</AppButton>
          </View>
        ) : (
          <View style={styles.options}>
            <AppButton
              mode="outlined"
              icon="crosshairs-gps"
              loading={status === 'locating'}
              disabled={status === 'locating'}
              onPress={() => { void locate(); }}
            >
              {status === 'locating' ? t('when.locating') : t('when.useCurrent')}
            </AppButton>
            <AppButton mode="outlined" icon="map-marker-outline" onPress={() => { setPickerOpen(true); }}>
              {t('when.pickDistrict')}
            </AppButton>
          </View>
        )}

        {status === 'denied' ? <InfoNote tone="error" icon="map-marker-off-outline" text={t('when.denied')} /> : null}
        {status === 'unavailable' ? <InfoNote tone="error" icon="map-marker-off-outline" text={t('when.unavailable')} /> : null}
      </View>

      <DistrictPicker
        visible={pickerOpen}
        selected={location?.districtId}
        onSelect={selectDistrict}
        onClose={() => { setPickerOpen(false); }}
      />
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  where: { gap: tokens.spacing.sm },
  heading: { color: tokens.colors.textPrimary },
  hint: { color: tokens.colors.textSecondary },
  options: { gap: tokens.spacing.sm },
  selected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.sm,
    borderWidth: 2,
    borderColor: tokens.colors.navy,
    backgroundColor: tokens.colors.mintLight,
  },
  selectedText: { flex: 1, color: tokens.colors.textPrimary },
});
