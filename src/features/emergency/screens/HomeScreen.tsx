import { type NavigationProp, useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../../app/navigation/navigation.types';
import type { EmergencyContact } from '../../../services/contracts';
import { AppButton } from '../../../shared/components/AppButton';
import { BrandLogo } from '../../../shared/components/Brand';
import { InfoNote } from '../../../shared/components/InfoNote';
import { LanguageToggle } from '../../../shared/components/LanguageToggle';
import { tokens } from '../../../shared/theme/tokens';
import { useAuth } from '../../account/authContext';
import { formatPhone } from '../../account/phone';
import { AddEmergencyContact } from '../components/AddEmergencyContact';
import { SosButton } from '../components/SosButton';
import { useSosContacts } from '../hooks/useSosContacts';

export function HomeScreen() {
  const { t } = useTranslation('emergency');
  const { t: tc } = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const sos = useSosContacts();
  const { requestLogin, user } = useAuth();
  const [failedContactId, setFailedContactId] = useState<string | null>(null);
  const failedContact = sos.contacts.find((contact) => contact.id === failedContactId);

  const call = async (contact: EmergencyContact) => {
    setFailedContactId(null);
    try { await Linking.openURL(`tel:${contact.phone}`); }
    catch { setFailedContactId(contact.id); }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <BrandLogo name={tc('appName')} />
        <LanguageToggle />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.center}>
          <SosButton onPress={() => { navigation.navigate('Sos'); }} />
          <View style={styles.captions}>
            <Text variant="titleLarge" style={styles.caption}>{t('homeCaption')}</Text>
            <Text variant="bodyMedium" style={styles.hint}>{t('homeHint')}</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text variant="titleMedium" accessibilityRole="header">{t('timeline.title')}</Text>
          <View style={styles.step}>
            <View style={styles.stepIcon}><Icon source="gesture-tap" size={22} color={tokens.colors.navy} /></View>
            <Text variant="bodyLarge" style={styles.stepLabel}>{t('timeline.tap')}</Text>
          </View>
          <View style={styles.step}>
            <View style={[styles.stepIcon, styles.sosStepIcon]}>
              <Icon source="phone-outgoing" size={22} color={tokens.colors.textOnDark} />
            </View>
            <Text variant="bodyLarge" style={styles.stepLabel}>
              {sos.primary ? t('timeline.callNamed', { name: sos.primary.name }) : t('timeline.callGeneric')}
            </Text>
          </View>
        </View>
        {sos.state === 'ready' ? (
          <View style={styles.section}>
            <Text variant="titleMedium" accessibilityRole="header">{t('contacts.title')}</Text>
            {sos.contacts.map((contact) => (
              <AppButton key={contact.id} mode="outlined" icon="phone" onPress={() => { void call(contact); }}>
                {t('callContact', { name: contact.name })} · {formatPhone(contact.phone)}
              </AppButton>
            ))}
            {failedContact ? <InfoNote tone="error" text={t('failedBody', { number: formatPhone(failedContact.phone) })} /> : null}
            <AddEmergencyContact key={user?.id} count={sos.contacts.length} />
            <AppButton mode="text" onPress={() => { navigation.navigate('MainTabs', { screen: 'Account' }); }}>
              {t('contacts.manage')}
            </AppButton>
          </View>
        ) : null}
        {sos.state === 'loggedOut' || sos.state === 'noContacts' ? (
          <View style={[styles.section, styles.contactPrompt]}>
            <Text variant="titleMedium" accessibilityRole="header">{t('none.title')}</Text>
            <Text variant="bodyMedium">{t(sos.state === 'loggedOut' ? 'none.loggedOut' : 'none.noContacts')}</Text>
            {sos.state === 'noContacts' ? <AddEmergencyContact key={user?.id} count={0} /> : (
              <>
                <AppButton mode="contained" onPress={() => { requestLogin('login'); }}>{t('none.login')}</AppButton>
                <AppButton mode="outlined" onPress={() => { requestLogin('signup'); }}>{t('none.signup')}</AppButton>
              </>
            )}
          </View>
        ) : null}
        {sos.state === 'loading' ? <Text accessibilityLiveRegion="polite">{tc('loading')}</Text> : null}
        {sos.state === 'error' ? (
          <View style={styles.section}>
            <InfoNote tone="error" text={tc('error')} />
            <AppButton mode="outlined" onPress={() => { navigation.navigate('MainTabs', { screen: 'Account' }); }}>
              {t('contacts.manage')}
            </AppButton>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: tokens.colors.screenBackground },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.sm,
  },
  content: { gap: tokens.spacing.xl, padding: tokens.spacing.lg, alignSelf: 'center', width: '100%', maxWidth: 560 },
  center: { alignItems: 'center', gap: tokens.spacing.lg },
  captions: { alignItems: 'center', gap: tokens.spacing.xs },
  caption: { color: tokens.colors.textPrimary, textAlign: 'center' },
  hint: { color: tokens.colors.textSecondary, textAlign: 'center', maxWidth: 320 },
  section: { gap: tokens.spacing.sm },
  step: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md },
  stepLabel: { flex: 1 },
  stepIcon: { borderRadius: tokens.radii.pill, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.mint },
  sosStepIcon: { backgroundColor: tokens.colors.sos },
  contactPrompt: { borderRadius: tokens.radii.md, backgroundColor: tokens.colors.mintSoft, padding: tokens.spacing.md },
});
