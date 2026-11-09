import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '../../../services/api/ApiError';
import type { ContactInput, EmergencyContact } from '../../../services/contracts';
import { MAX_CONTACTS } from '../../../services/contracts/account';
import { AppButton } from '../../../shared/components/AppButton';
import { InfoNote } from '../../../shared/components/InfoNote';
import { tokens } from '../../../shared/theme/tokens';
import { useAuth } from '../authContext';
import { env } from '../../../config/env';
import { ContactCard } from '../components/ContactCard';
import { ContactFormModal } from '../components/ContactFormModal';
import { useContactMutations, useContacts } from '../hooks/useContacts';
import { contactErrorKey } from '../contactErrors';

// The first contact in the list is the one SOS calls. Contacts are shown, edited and removed here only.
export function AccountScreen() {
  const { t } = useTranslation('account');
  const { user, status, logOut, requestLogin } = useAuth();
  const contacts = useContacts();
  const mutations = useContactMutations();
  const [editing, setEditing] = useState<EmergencyContact | 'new' | null>(null);
  const [editingOwner, setEditingOwner] = useState<string | null>(null);
  const currentOwner = useRef(user?.id);
  useLayoutEffect(() => {
    currentOwner.current = user?.id;
    return () => { currentOwner.current = undefined; };
  }, [user?.id]);
  const currentEditing = editingOwner === user?.id ? editing : null;
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <View style={styles.state}><ActivityIndicator size="large" color={tokens.colors.navy} /></View>
      </SafeAreaView>
    );
  }

  // Someone using the app without an account: say what an account is for, and how to get one.
  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text variant="headlineMedium" style={styles.title} accessibilityRole="header">{t('account.guestTitle')}</Text>
          <Text variant="bodyLarge" style={styles.muted}>{t('account.guestBody')}</Text>
          <AppButton mode="contained" onPress={() => { requestLogin('login'); }}>{t('auth.loginSubmit')}</AppButton>
          <AppButton mode="outlined" onPress={() => { requestLogin('signup'); }}>{t('auth.signupSubmit')}</AppButton>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const permissionError = contacts.error instanceof ApiError && ['unauthorized', 'forbidden'].includes(contacts.error.kind);
  const list = permissionError ? [] : contacts.data ?? [];
  const atLimit = list.length >= MAX_CONTACTS;
  const saving = mutations.add.isPending || mutations.update.isPending;
  const busy = saving || mutations.makePrimary.isPending || mutations.remove.isPending || contacts.isFetching;
  const operationError = mutations.remove.error ?? mutations.makePrimary.error;
  const needsLogin = [contacts.error, mutations.add.error, mutations.update.error, operationError]
    .some((error) => error instanceof ApiError && error.kind === 'unauthorized');

  const saveError = (() => {
    const error = mutations.add.error ?? mutations.update.error;
    if (!error) return undefined;
    return t(contactErrorKey(error), { max: MAX_CONTACTS });
  })();

  const closeForm = () => {
    setEditing(null);
    mutations.add.reset();
    mutations.update.reset();
  };

  const openForm = (contact: EmergencyContact | 'new') => {
    setEditingOwner(user.id);
    setEditing(contact);
    mutations.remove.reset();
    mutations.makePrimary.reset();
  };

  const save = (input: ContactInput) => {
    if (!currentEditing) return;
    const owner = user.id;
    const done = { onSuccess: () => { if (currentOwner.current === owner) closeForm(); } };
    if (currentEditing !== 'new') mutations.update.mutate({ id: currentEditing.id, input }, done);
    else mutations.add.mutate(input, done);
  };

  // A native confirmation: removing is easy to regret, and the system dialog is familiar and accessible.
  const confirmRemove = (contact: EmergencyContact) => {
    const owner = user.id;
    Alert.alert(t('contacts.removeTitle', { name: contact.name }), t('contacts.removeBody'), [
      { text: t('contacts.cancel'), style: 'cancel' },
      { text: t('contacts.removeConfirm'), style: 'destructive', onPress: () => {
        if (currentOwner.current !== owner) return;
        mutations.makePrimary.reset();
        mutations.remove.mutate(contact.id);
      } },
    ]);
  };

  const doLogOut = async () => {
    setLoggingOut(true);
    setLogoutError(false);
    try { await logOut(); }
    catch { setLogoutError(true); }
    finally { setLoggingOut(false); }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineMedium" style={styles.title} accessibilityRole="header">{t('account.hello', { name: user.name })}</Text>

        <View style={styles.sectionHeader}>
          <View style={styles.flex}>
            <Text variant="titleLarge" style={styles.sectionTitle} accessibilityRole="header">{t('contacts.title')}</Text>
            <Text variant="bodyMedium" style={styles.muted}>{t('contacts.subtitle', { max: MAX_CONTACTS })}</Text>
          </View>
          <View style={styles.count}>
            <Text variant="labelLarge" style={styles.countLabel}>{t('contacts.count', { count: list.length, max: MAX_CONTACTS })}</Text>
          </View>
        </View>

        {contacts.isPending ? <ActivityIndicator size="large" color={tokens.colors.navy} /> : null}
        {contacts.isError ? (
          <>
            <InfoNote tone="error" icon="alert-circle-outline" text={t(contactErrorKey(contacts.error), { max: MAX_CONTACTS })} />
            <AppButton mode="text" onPress={() => { void contacts.refetch(); }}>{t('contacts.retry')}</AppButton>
          </>
        ) : null}
        {operationError ? <InfoNote tone="error" text={t(contactErrorKey(operationError), { max: MAX_CONTACTS })} /> : null}
        {needsLogin ? <AppButton mode="text" onPress={() => { requestLogin('login'); }}>{t('auth.loginSubmit')}</AppButton> : null}
        {contacts.isSuccess && list.length === 0 ? (
          <View style={styles.empty}><Text variant="bodyLarge" style={styles.muted}>{t('contacts.empty')}</Text></View>
        ) : null}

        {list.map((contact, index) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            isPrimary={index === 0}
            busy={busy}
            onEdit={() => { openForm(contact); }}
            onRemove={() => { confirmRemove(contact); }}
            onMakePrimary={() => { mutations.remove.reset(); mutations.makePrimary.mutate(contact.id); }}
          />
        ))}

        <AppButton mode="contained" icon="plus" disabled={atLimit || contacts.isPending || contacts.isError || busy} onPress={() => { openForm('new'); }}>
          {t('contacts.add')}
        </AppButton>
        {atLimit ? <Text variant="bodyMedium" style={styles.muted}>{t('contacts.limit', { max: MAX_CONTACTS })}</Text> : null}

        <InfoNote icon="shield-check-outline" text={t('contacts.privacy')} />
        <Text variant="bodySmall" style={styles.muted}>{t(env.dataMode === 'api' ? 'contacts.serverStorage'
          : env.authMode === 'demo' ? 'contacts.demoStorage' : 'contacts.notConnected')}</Text>

        {/* Logging out is rare and easy to regret, so it sits at the end, apart from the contacts. */}
        <View style={styles.footer}>
          {logoutError ? <InfoNote tone="error" text={t('account.logoutError')} /> : null}
          <Text variant="bodyMedium" style={styles.muted}>{t('account.signedInAs', { email: user.email })}</Text>
          <AppButton mode="outlined" icon="logout" loading={loggingOut} disabled={loggingOut} onPress={() => { void doLogOut(); }}>
            {loggingOut ? t('account.loggingOut') : t('account.logout')}
          </AppButton>
        </View>
      </ScrollView>

      {currentEditing !== null ? <ContactFormModal
        key={`${user.id}:${currentEditing === 'new' ? 'new' : currentEditing.id}`}
        visible
        contact={currentEditing !== 'new' ? currentEditing : undefined}
        saving={saving}
        error={saveError}
        onSave={save}
        onClose={closeForm}
      /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: tokens.colors.screenBackground },
  content: { flexGrow: 1, padding: tokens.spacing.lg, gap: tokens.spacing.md },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { color: tokens.colors.navy },
  sectionTitle: { color: tokens.colors.textPrimary },
  muted: { color: tokens.colors.textSecondary },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: tokens.spacing.sm, marginTop: tokens.spacing.md },
  count: { paddingHorizontal: tokens.spacing.sm, paddingVertical: tokens.spacing.xs, borderRadius: tokens.radii.pill, backgroundColor: tokens.colors.mintSoft },
  countLabel: { color: tokens.colors.navy },
  empty: { padding: tokens.spacing.lg, borderRadius: tokens.radii.md, borderWidth: 2, borderStyle: 'dashed', borderColor: tokens.colors.textSecondary },
  footer: { gap: tokens.spacing.sm, marginTop: tokens.spacing.lg, paddingTop: tokens.spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: tokens.colors.border },
});
