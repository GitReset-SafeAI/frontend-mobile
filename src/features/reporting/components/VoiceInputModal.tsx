import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '../../../shared/components/AppButton';
import { InfoNote } from '../../../shared/components/InfoNote';
import { tokens } from '../../../shared/theme/tokens';
import { useTranscribeVoice } from '../hooks/useSubmitReport';

type Phase = 'idle' | 'recording' | 'transcribing' | 'error';

interface VoiceInputModalProps {
  visible: boolean;
  onClose: () => void;
  // The transcript is inserted into the editable description field; the user must review it.
  onTranscript: (text: string) => void;
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function VoiceInputModal({ visible, onClose, onTranscript }: VoiceInputModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Mounted only while open, so every opening starts from a clean state. */}
      <VoiceSheet onClose={onClose} onTranscript={onTranscript} />
    </Modal>
  );
}

// Demo flow: no microphone access and no audio is captured. The mock service returns a sample
// transcript so the review/edit step can be designed and tested before the speech backend exists.
function VoiceSheet({ onClose, onTranscript }: Omit<VoiceInputModalProps, 'visible'>) {
  const { t } = useTranslation('reporting');
  const { t: tc } = useTranslation();
  const transcribe = useTranscribeVoice();
  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (phase !== 'recording') return;
    const timer = setInterval(() => { setSeconds((value) => value + 1); }, 1000);
    return () => { clearInterval(timer); };
  }, [phase]);

  const stop = async () => {
    setPhase('transcribing');
    try {
      const { text } = await transcribe.mutateAsync();
      if (mounted.current) onTranscript(text);
    } catch {
      if (mounted.current) setPhase('error');
    }
  };

  const retry = () => { setPhase('idle'); setSeconds(0); };

  const status = phase === 'recording' ? t('voice.recording', { time: formatTime(seconds) })
    : phase === 'transcribing' ? t('voice.transcribing')
      : phase === 'error' ? t('voice.error')
        : t('voice.idle');

  return (
    <View style={styles.backdrop}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel={tc('close')} accessibilityRole="button" />
      <SafeAreaView style={styles.sheet} edges={['bottom']}>
        <Text variant="titleLarge" style={styles.title} accessibilityRole="header">{t('voice.title')}</Text>
        <InfoNote text={t('voice.demoNote')} />
        <View style={styles.status}>
          {phase === 'transcribing'
            ? <ActivityIndicator size="large" color={tokens.colors.navy} />
            : <Icon source={phase === 'recording' ? 'microphone' : 'microphone-outline'} size={56} color={tokens.colors.navy} />}
          <Text variant="bodyLarge" style={styles.statusText} accessibilityLiveRegion="polite">{status}</Text>
        </View>
        {phase === 'idle' ? (
          <AppButton mode="contained" icon="microphone" onPress={() => { setPhase('recording'); }}>{t('voice.start')}</AppButton>
        ) : null}
        {phase === 'recording' ? (
          <AppButton mode="contained" icon="stop" onPress={() => { void stop(); }}>{t('voice.stop')}</AppButton>
        ) : null}
        {phase === 'error' ? (
          <AppButton mode="contained" icon="refresh" onPress={retry}>{t('voice.retry')}</AppButton>
        ) : null}
        <AppButton mode="text" onPress={onClose}>{tc('cancel')}</AppButton>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: `${tokens.colors.textPrimary}99` },
  sheet: {
    gap: tokens.spacing.md,
    padding: tokens.spacing.lg,
    borderTopLeftRadius: tokens.radii.lg,
    borderTopRightRadius: tokens.radii.lg,
    backgroundColor: tokens.colors.surface,
  },
  title: { color: tokens.colors.navy },
  status: { alignItems: 'center', gap: tokens.spacing.sm, paddingVertical: tokens.spacing.md },
  statusText: { color: tokens.colors.textPrimary, textAlign: 'center' },
});
