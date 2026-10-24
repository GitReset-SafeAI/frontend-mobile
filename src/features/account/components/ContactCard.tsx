import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, View } from 'react-native';
import { Button, Card, Icon, Text } from 'react-native-paper';

import type { EmergencyContact } from '../../../services/contracts';
import { tokens } from '../../../shared/theme/tokens';
import { formatPhone } from '../phone';

interface ContactCardProps {
  contact: EmergencyContact;
  isPrimary: boolean;
  busy?: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onMakePrimary: () => void;
}

export function ContactCard({ contact, isPrimary, busy = false, onEdit, onRemove, onMakePrimary }: ContactCardProps) {
  const { t } = useTranslation('account');
  const actionProps = { mode: 'text' as const, compact: true, textColor: tokens.colors.navy, contentStyle: styles.actionContent };

  return (
    <Card mode="outlined" style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <View style={styles.identity}>
            <Text variant="titleLarge" style={styles.name}>{contact.name}</Text>
            <Text variant="bodyLarge" style={styles.phone}>{formatPhone(contact.phone)}</Text>
          </View>
          <View style={styles.badges}>
            {isPrimary ? (
              <View style={styles.primary}>
                <Icon source="star" size={16} color={tokens.colors.textOnDark} />
                <Text variant="labelLarge" style={styles.primaryLabel}>{t('contacts.primary')}</Text>
              </View>
            ) : null}
            {contact.relationship ? (
              <View style={styles.relation}>
                <Text variant="labelLarge" style={styles.relationLabel}>{t(`contacts.relationships.${contact.relationship}`)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            {...actionProps}
            icon="phone"
            accessibilityLabel={t('contacts.callA11y', { name: contact.name })}
            onPress={() => { void Linking.openURL(`tel:${contact.phone}`); }}
          >
            {t('contacts.call')}
          </Button>
          {isPrimary ? null : (
            <Button
              {...actionProps}
              icon="star-outline"
              disabled={busy}
              accessibilityLabel={t('contacts.makePrimaryA11y', { name: contact.name })}
              onPress={onMakePrimary}
            >
              {t('contacts.makePrimary')}
            </Button>
          )}
          <Button {...actionProps} disabled={busy} accessibilityLabel={t('contacts.editA11y', { name: contact.name })} onPress={onEdit}>
            {t('contacts.edit')}
          </Button>
          <Button
            {...actionProps}
            textColor={tokens.colors.status.error}
            disabled={busy}
            accessibilityLabel={t('contacts.removeA11y', { name: contact.name })}
            onPress={onRemove}
          >
            {t('contacts.remove')}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  content: { gap: tokens.spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: tokens.spacing.sm },
  identity: { flex: 1 },
  name: { color: tokens.colors.textPrimary },
  phone: { color: tokens.colors.textPrimary },
  badges: { alignItems: 'flex-end', gap: tokens.spacing.xs },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radii.pill,
    backgroundColor: tokens.colors.navy,
  },
  primaryLabel: { color: tokens.colors.textOnDark },
  relation: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radii.pill,
    backgroundColor: tokens.colors.mintLight,
  },
  relationLabel: { color: tokens.colors.textPrimary },
  actions: { flexDirection: 'row', flexWrap: 'wrap', marginLeft: -tokens.spacing.sm },
  actionContent: { minHeight: tokens.touchTarget },
});
