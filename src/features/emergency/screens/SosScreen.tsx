import { type NavigationProp, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Linking, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../../app/navigation/navigation.types';
import type { EmergencyContact } from '../../../services/contracts';
import { AppButton } from '../../../shared/components/AppButton';
import { tokens } from '../../../shared/theme/tokens';
import { useAuth } from '../../account/authContext';
import { formatPhone } from '../../account/phone';
import { useSosContacts } from '../hooks/useSosContacts';
import { SOS_COUNTDOWN_SECONDS } from '../sos';

type Phase = 'countdown' | 'dialing' | 'called' | 'failed';

// Tap SOS -> short cancellable countdown -> dial the primary emergency contact. One tap is enough in an
// emergency, while the countdown and a large Cancel protect against accidental presses.
export function SosScreen() {
  const { t } = useTranslation('emergency');
  const { t: tc } = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { requestLogin } = useAuth();
  const sos = useSosContacts();
  const close = () => { navigation.goBack(); };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      {sos.state === 'loading' ? (
        <View style={styles.center}>
          <Text variant="headlineSmall" style={styles.title} accessibilityLiveRegion="polite">{tc('loading')}</Text>
        </View>
      ) : null}

      {sos.state === 'error' ? (
        <>
          <View style={styles.center}>
            <Icon source="phone-alert" size={72} color={tokens.colors.textOnDark} />
            <Text variant="headlineMedium" style={styles.title} accessibilityRole="header">{tc('error')}</Text>
          </View>
          <View style={styles.actions}>
            <AppButton mode="contained" buttonColor={tokens.colors.surface} textColor={tokens.colors.sos} onPress={close}>{t('close')}</AppButton>
          </View>
        </>
      ) : null}

      {sos.state === 'loggedOut' || sos.state === 'noContacts' ? (
        <>
          <View style={styles.center}>
            <Icon source="account-heart-outline" size={72} color={tokens.colors.textOnDark} />
            <Text variant="headlineMedium" style={styles.title} accessibilityRole="header">{t('none.title')}</Text>
            <Text variant="bodyLarge" style={styles.body}>
              {sos.state === 'loggedOut' ? t('none.loggedOut') : t('none.noContacts')}
            </Text>
          </View>
          <View style={styles.actions}>
            {sos.state === 'loggedOut' ? (
              <>
                <AppButton mode="contained" buttonColor={tokens.colors.surface} textColor={tokens.colors.sos} onPress={() => { requestLogin('login'); }}>
                  {t('none.login')}
                </AppButton>
                <AppButton mode="outlined" textColor={tokens.colors.textOnDark} style={styles.outlined} onPress={() => { requestLogin('signup'); }}>
                  {t('none.signup')}
                </AppButton>
              </>
            ) : (
              <AppButton
                mode="contained"
                buttonColor={tokens.colors.surface}
                textColor={tokens.colors.sos}
                onPress={() => { navigation.navigate('MainTabs', { screen: 'Account' }); }}
              >
                {t('none.add')}
              </AppButton>
            )}
            <AppButton mode="text" textColor={tokens.colors.textOnDark} onPress={close}>{t('close')}</AppButton>
          </View>
        </>
      ) : null}

      {sos.state === 'ready' ? <SosFlow primary={sos.primary} contacts={sos.contacts} onClose={close} /> : null}
    </SafeAreaView>
  );
}

interface SosFlowProps {
  primary: EmergencyContact;
  contacts: EmergencyContact[];
  onClose: () => void;
}

// Mounted only once there is someone to call, so the countdown never starts without a target.
function SosFlow({ primary, contacts, onClose }: SosFlowProps) {
  const { t } = useTranslation('emergency');
  const [phase, setPhase] = useState<Phase>('countdown');
  const [secondsLeft, setSecondsLeft] = useState(SOS_COUNTDOWN_SECONDS);
  const [dialled, setDialled] = useState<EmergencyContact>(primary);
  const announced = useRef(false);

  const dial = useCallback(async (contact: EmergencyContact) => {
    setDialled(contact);
    setPhase('dialing');
    try {
      await Linking.openURL(`tel:${contact.phone}`);
      setPhase('called');
    } catch {
      setPhase('failed');
    }
  }, []);

  useEffect(() => {
    if (announced.current) return;
    announced.current = true;
    AccessibilityInfo.announceForAccessibility(
      t('announceStart', { name: primary.name, seconds: SOS_COUNTDOWN_SECONDS }),
    );
  }, [t, primary.name]);

  useEffect(() => {
    if (phase !== 'countdown') return;
    const timer = setTimeout(() => {
      if (secondsLeft <= 1) {
        setSecondsLeft(0);
        void dial(primary);
      } else {
        setSecondsLeft(secondsLeft - 1);
      }
    }, 1000);
    return () => { clearTimeout(timer); };
  }, [phase, secondsLeft, dial, primary]);

  const others = contacts.filter((contact) => contact.id !== dialled.id);

  return (
    <>
      {phase === 'countdown' ? (
        <>
          <View style={styles.center}>
            <Text variant="titleLarge" style={styles.title} accessibilityRole="header">
              {t('countdownTitle', { name: primary.name })}
            </Text>
            <Text style={styles.number} allowFontScaling={false}>{secondsLeft}</Text>
            <Text variant="titleLarge" style={styles.title}>{t('secondsLabel', { count: secondsLeft })}</Text>
          </View>
          <View style={styles.actions}>
            <AppButton
              mode="contained"
              buttonColor={tokens.colors.surface}
              textColor={tokens.colors.sos}
              onPress={() => { void dial(primary); }}
            >
              {t('callNow')}
            </AppButton>
            <AppButton mode="outlined" textColor={tokens.colors.textOnDark} style={styles.outlined} onPress={onClose}>
              {t('cancel')}
            </AppButton>
            <Text variant="bodyMedium" style={styles.disclaimer}>{t('disclaimer')}</Text>
          </View>
        </>
      ) : null}

      {phase === 'dialing' ? (
        <View style={styles.center}>
          <Text variant="headlineSmall" style={styles.title} accessibilityLiveRegion="polite">{t('dialingTitle')}</Text>
        </View>
      ) : null}

      {phase === 'called' || phase === 'failed' ? (
        <>
          <View style={styles.center}>
            <Icon source={phase === 'called' ? 'phone-check' : 'phone-alert'} size={72} color={tokens.colors.textOnDark} />
            <Text variant="headlineMedium" style={styles.title} accessibilityRole="header" accessibilityLiveRegion="polite">
              {phase === 'called' ? t('calledTitle') : t('failedTitle')}
            </Text>
            <Text variant="bodyLarge" style={styles.body}>
              {phase === 'called' ? t('calledBody') : t('failedBody', { number: formatPhone(dialled.phone) })}
            </Text>
          </View>
          <View style={styles.actions}>
            <AppButton
              mode="contained"
              buttonColor={tokens.colors.surface}
              textColor={tokens.colors.sos}
              onPress={() => { void dial(dialled); }}
            >
              {t('callAgain', { name: dialled.name })}
            </AppButton>
            {others.map((contact) => (
              <AppButton
                key={contact.id}
                mode="outlined"
                textColor={tokens.colors.textOnDark}
                style={styles.outlined}
                onPress={() => { void dial(contact); }}
              >
                {t('callContact', { name: contact.name })}
              </AppButton>
            ))}
            <AppButton mode="text" textColor={tokens.colors.textOnDark} onPress={onClose}>{t('close')}</AppButton>
          </View>
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: tokens.colors.sos },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.md, padding: tokens.spacing.lg },
  title: { color: tokens.colors.textOnDark, textAlign: 'center' },
  body: { color: tokens.colors.textOnDark, textAlign: 'center' },
  number: { color: tokens.colors.textOnDark, fontSize: 140, lineHeight: 160, fontWeight: '800' },
  actions: { gap: tokens.spacing.sm, padding: tokens.spacing.lg },
  outlined: { borderColor: tokens.colors.textOnDark, borderWidth: 2 },
  disclaimer: { color: tokens.colors.textOnDark, textAlign: 'center', marginTop: tokens.spacing.sm },
});
