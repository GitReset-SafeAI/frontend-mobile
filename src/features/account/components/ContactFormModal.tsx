import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { HelperText, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ContactInput, ContactRelationship, EmergencyContact } from '../../../services/contracts';
import { contactRelationships } from '../../../services/contracts/account';
import { AppButton } from '../../../shared/components/AppButton';
import { ChoiceGroup } from '../../../shared/components/ChoiceGroup';
import { InfoNote } from '../../../shared/components/InfoNote';
import { tokens } from '../../../shared/theme/tokens';
import { formatPhone, normalizePhone } from '../phone';

interface ContactFormModalProps {
  visible: boolean;
  // Present when editing; absent when adding.
  contact?: EmergencyContact;
  saving: boolean;
  // A failure from the service, already translated.
  error?: string;
  onSave: (input: ContactInput) => void;
  onClose: () => void;
}

export function ContactFormModal({ visible, ...props }: ContactFormModalProps) {
  const { t: tc } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={props.onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.scrim} onPress={props.onClose} accessibilityLabel={tc('close')} accessibilityRole="button" />
        {/* Mounted only while open, so every opening starts from a clean (or the chosen contact's) state. */}
        <ContactForm {...props} />
      </View>
    </Modal>
  );
}

function ContactForm({ contact, saving, error, onSave, onClose }: Omit<ContactFormModalProps, 'visible'>) {
  const { t } = useTranslation('account');
  const [name, setName] = useState(contact?.name ?? '');
  const [phone, setPhone] = useState(contact ? formatPhone(contact.phone) : '');
  const [relationship, setRelationship] = useState<ContactRelationship | undefined>(contact?.relationship);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const submit = () => {
    const normalised = normalizePhone(phone);
    const next = {
      name: name.trim() ? undefined : t('contacts.errors.name'),
      phone: normalised ? undefined : t('contacts.errors.phone'),
    };
    setErrors(next);
    if (next.name || next.phone || !normalised) return;
    onSave({ name: name.trim(), phone: normalised, relationship });
  };

  const inputProps = {
    mode: 'outlined' as const,
    outlineColor: tokens.colors.textSecondary,
    activeOutlineColor: tokens.colors.navy,
    style: styles.input,
    disabled: saving,
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.sheet} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          <Text variant="titleLarge" style={styles.title} accessibilityRole="header">
            {contact ? t('contacts.formTitleEdit') : t('contacts.formTitleAdd')}
          </Text>
          <View>
            <TextInput
              {...inputProps}
              label={t('contacts.name')}
              accessibilityLabel={t('contacts.name')}
              value={name}
              onChangeText={setName}
              error={Boolean(errors.name)}
              maxLength={60}
              autoComplete="off"
            />
            <HelperText type="error" visible={Boolean(errors.name)}>{errors.name}</HelperText>
          </View>
          <View>
            <TextInput
              {...inputProps}
              label={t('contacts.phone')}
              accessibilityLabel={t('contacts.phone')}
              value={phone}
              onChangeText={setPhone}
              error={Boolean(errors.phone)}
              keyboardType="phone-pad"
              autoComplete="off"
            />
            <HelperText type={errors.phone ? 'error' : 'info'} visible>{errors.phone ?? t('contacts.phoneHint')}</HelperText>
          </View>
          <ChoiceGroup<ContactRelationship>
            label={t('contacts.relationship')}
            options={contactRelationships.map((value) => ({ value, label: t(`contacts.relationships.${value}`) }))}
            value={relationship}
            onChange={setRelationship}
          />
          {error ? <InfoNote tone="error" icon="alert-circle-outline" text={error} /> : null}
          <AppButton mode="contained" loading={saving} disabled={saving} onPress={submit}>
            {saving ? t('contacts.saving') : t('contacts.save')}
          </AppButton>
          <AppButton mode="text" disabled={saving} onPress={onClose}>{t('contacts.cancel')}</AppButton>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: `${tokens.colors.textPrimary}99` },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: tokens.radii.lg,
    borderTopRightRadius: tokens.radii.lg,
    backgroundColor: tokens.colors.surface,
  },
  sheetContent: { gap: tokens.spacing.md, padding: tokens.spacing.lg },
  title: { color: tokens.colors.navy },
  input: { backgroundColor: tokens.colors.surface },
});
