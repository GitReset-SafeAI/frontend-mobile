import { type NavigationProp, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../../app/navigation/navigation.types';
import type { EmergencyContact } from '../../../services/contracts';
import { AppButton } from '../../../shared/components/AppButton';
import { tokens } from '../../../shared/theme/tokens';
import { useAuth } from '../../account/authContext';
import { formatPhone } from '../../account/phone';
import { useSosContacts } from '../hooks/useSosContacts';
import { useEmergencyLocation } from '../hooks/useEmergencyLocation';

export function SosScreen() {
  const { t } = useTranslation('emergency');
  const { t: tc } = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { requestLogin, user } = useAuth();
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
            <AppButton mode="text" labelStyle={styles.onRed} onPress={close}>{t('close')}</AppButton>
          </View>
        </>
      ) : null}

      {sos.state === 'ready' && user ? <SosFlow key={user.id} userId={user.id} primary={sos.primary} contacts={sos.contacts} onClose={close} /> : null}
    </SafeAreaView>
  );
}

interface SosFlowProps {
  userId: string;
  primary: EmergencyContact;
  contacts: EmergencyContact[];
  onClose: () => void;
}

function SosFlow({ userId, primary, contacts, onClose }: SosFlowProps) {
  const { t } = useTranslation('emergency');
  const [selectedId, setSelectedId] = useState(primary.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [callError, setCallError] = useState(false);
  const tracking = useEmergencyLocation(userId);
  const selected = contacts.find((contact) => contact.id === selectedId) ?? primary;

  const call = async () => {
    setMenuOpen(false);
    setCallError(false);
    try { await Linking.openURL(`tel:${selected.phone}`); }
    catch { setCallError(true); }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.flow}>
        <Text variant="headlineMedium" style={styles.onRed} accessibilityRole="header">{t('sms.choose')}</Text>
        <View style={styles.field}>
          <Text variant="titleMedium" style={styles.onRed}>{t('sms.contact')}</Text>
          <Pressable
            style={styles.contactPicker}
            accessibilityRole="button"
            accessibilityLabel={t('sms.contact')}
            accessibilityValue={{ text: `${selected.name}, ${formatPhone(selected.phone)}` }}
            accessibilityState={{ expanded: menuOpen, disabled: tracking.busy }}
            disabled={tracking.busy}
            onPress={() => { setMenuOpen(!menuOpen); }}
          >
            <Text variant="bodyLarge" style={styles.contactLabel}>
              {`${selected.name} \u2014 ${formatPhone(selected.phone)}`}
            </Text>
            <Icon source={menuOpen ? 'chevron-up' : 'chevron-down'} size={24} color={tokens.colors.navy} />
          </Pressable>
          {menuOpen ? (
            <View accessibilityRole="radiogroup" style={styles.contactList}>
              {contacts.map((contact) => (
                <Pressable
                  key={contact.id}
                  style={styles.contactOption}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: contact.id === selected.id }}
                  disabled={tracking.busy}
                  onPress={() => { setSelectedId(contact.id); setCallError(false); setMenuOpen(false); }}
                >
                  <Text variant="bodyLarge" style={styles.contactLabel}>
                    {`${contact.name} \u2014 ${formatPhone(contact.phone)}`}
                  </Text>
                  {contact.id === selected.id ? <Icon source="check" size={24} color={tokens.colors.navy} /> : null}
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <AppButton mode="contained" icon="phone" buttonColor={tokens.colors.surface} textColor={tokens.colors.sos}
          onPress={() => { void call(); }}>
          {t('sms.call')}
        </AppButton>
        <AppButton mode="outlined" textColor={tokens.colors.textOnDark} style={styles.outlined}
          loading={tracking.busy && !tracking.share} disabled={tracking.busy || !!tracking.share}
          onPress={() => { setMenuOpen(false); void tracking.send(selected.phone); }}>
          {tracking.busy && !tracking.share ? t('sms.preparing') : t('sms.sendLocation')}
        </AppButton>

        {callError ? <Text style={styles.onRed} accessibilityRole="alert">{t('failedBody', { number: formatPhone(selected.phone) })}</Text> : null}
        {tracking.error ? <Text style={styles.onRed} accessibilityRole="alert">{t(`sms.errors.${tracking.error}`)}</Text> : null}
        {tracking.message ? (
          <>
            {tracking.draftOpened ? <Text style={styles.onRed} accessibilityLiveRegion="polite">{t('sms.draftReady')}</Text> : null}
            <View style={styles.field}>
              <Text style={styles.onRed}>{t('sms.preview')}</Text>
              <Text selectable variant="bodyLarge" style={styles.preview}>{tracking.message}</Text>
            </View>
            <AppButton mode="contained" buttonColor={tokens.colors.surface} textColor={tokens.colors.sos} disabled={tracking.busy}
              onPress={() => { tracking.reopen(selected.phone); }}>
              {t('sms.reopen')}
            </AppButton>
            <Text variant="bodyMedium" style={styles.onRed}>{t('sms.sharingNote')}</Text>
            <AppButton mode="outlined" textColor={tokens.colors.textOnDark} style={styles.outlined}
              disabled={tracking.busy} onPress={() => { void tracking.stop(); }}>
              {t('sms.stop')}
            </AppButton>
          </>
        ) : null}

        <Text variant="bodyMedium" style={styles.onRed}>{t('sms.costNote')}</Text>
        <AppButton mode="text" labelStyle={styles.onRed} onPress={onClose}>{t('close')}</AppButton>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: tokens.colors.sos },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.md, padding: tokens.spacing.lg },
  title: { color: tokens.colors.textOnDark, textAlign: 'center' },
  body: { color: tokens.colors.textOnDark, textAlign: 'center' },
  actions: { gap: tokens.spacing.sm, padding: tokens.spacing.lg },
  outlined: { borderColor: tokens.colors.textOnDark, borderWidth: 2 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: tokens.spacing.lg },
  flow: { width: '100%', maxWidth: 512, alignSelf: 'center', gap: tokens.spacing.md },
  field: { gap: tokens.spacing.sm },
  onRed: { color: tokens.colors.textOnDark },
  contactPicker: {
    minHeight: tokens.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    backgroundColor: tokens.colors.surface,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radii.sm,
  },
  contactList: { borderRadius: tokens.radii.sm, backgroundColor: tokens.colors.surface },
  contactOption: {
    minHeight: tokens.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
  contactLabel: { flex: 1, color: tokens.colors.navy },
  preview: {
    backgroundColor: tokens.colors.surface,
    color: tokens.colors.navy,
    borderRadius: tokens.radii.sm,
    padding: tokens.spacing.md,
  },
});
