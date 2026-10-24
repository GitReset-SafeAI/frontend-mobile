import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { HelperText, Text, TextInput } from 'react-native-paper';

import type { ReportStackParamList } from '../../../app/navigation/navigation.types';
import { AppButton } from '../../../shared/components/AppButton';
import { InfoNote } from '../../../shared/components/InfoNote';
import { StepLayout } from '../../../shared/layouts/StepLayout';
import { tokens } from '../../../shared/theme/tokens';
import { DESCRIPTION_MAX_LENGTH, DESCRIPTION_MIN_LENGTH } from '../../../services/contracts/incident';
import { VoiceInputModal } from '../components/VoiceInputModal';
import { useReportDraft } from '../reportDraft';

type Props = NativeStackScreenProps<ReportStackParamList, 'ReportDescribe'>;

export function ReportDescribeScreen({ navigation }: Props) {
  const { t } = useTranslation('reporting');
  const { t: tc } = useTranslation();
  const { draft, update, reset } = useReportDraft();
  const [attempted, setAttempted] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);

  const tooShort = draft.description.trim().length < DESCRIPTION_MIN_LENGTH;
  const showLengthError = attempted && tooShort;
  const showTranscriptError = attempted && draft.transcriptPending;

  const onNext = () => {
    setAttempted(true);
    if (tooShort || draft.transcriptPending) return;
    navigation.navigate('ReportWhen');
  };

  const onTranscript = (text: string) => {
    const existing = draft.description.trim();
    update({
      description: existing ? `${existing} ${text}` : text,
      inputMethod: 'voice',
      transcriptPending: true,
    });
    setVoiceOpen(false);
  };

  return (
    <StepLayout
      step={{ current: 1, total: 3 }}
      title={t('describe.title')}
      subtitle={t('describe.subtitle')}
      footer={<AppButton mode="contained" style={styles.flex} onPress={onNext}>{tc('next')}</AppButton>}
    >
      <View style={styles.field}>
        <TextInput
          mode="outlined"
          multiline
          value={draft.description}
          onChangeText={(description) => { update({ description }); }}
          placeholder={t('describe.placeholder')}
          accessibilityLabel={t('describe.a11yLabel')}
          maxLength={DESCRIPTION_MAX_LENGTH}
          error={showLengthError}
          outlineColor={tokens.colors.textSecondary}
          activeOutlineColor={tokens.colors.navy}
          style={styles.input}
          textAlignVertical="top"
        />
        <View style={styles.meta}>
          <HelperText type="error" visible={showLengthError} style={styles.error}>
            {t('describe.error', { min: DESCRIPTION_MIN_LENGTH })}
          </HelperText>
          <Text variant="labelMedium" style={styles.counter}>
            {t('describe.counter', { count: draft.description.length, max: DESCRIPTION_MAX_LENGTH })}
          </Text>
        </View>
      </View>

      {draft.transcriptPending ? (
        <View style={styles.transcript}>
          <InfoNote icon="text-box-check-outline" text={`${t('describe.transcriptTitle')}. ${t('describe.transcriptBody')}`} />
          {showTranscriptError ? <HelperText type="error" visible>{t('describe.transcriptNeeded')}</HelperText> : null}
          <AppButton mode="contained-tonal" icon="check" onPress={() => { update({ transcriptPending: false }); }}>
            {t('describe.transcriptConfirm')}
          </AppButton>
        </View>
      ) : null}

      <AppButton mode="outlined" icon="microphone-outline" onPress={() => { setVoiceOpen(true); }}>
        {t('describe.voice')}
      </AppButton>

      {draft.description.length > 0 ? (
        <AppButton mode="text" icon="restart" onPress={() => { reset(); setAttempted(false); }}>
          {t('describe.startOver')}
        </AppButton>
      ) : null}

      <VoiceInputModal visible={voiceOpen} onClose={() => { setVoiceOpen(false); }} onTranscript={onTranscript} />
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  field: { gap: tokens.spacing.xs },
  input: { minHeight: 180, backgroundColor: tokens.colors.surface, fontSize: tokens.typography.body.fontSize },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  error: { flex: 1, paddingHorizontal: 0 },
  counter: { color: tokens.colors.textSecondary, paddingTop: tokens.spacing.xs },
  transcript: { gap: tokens.spacing.sm },
});
