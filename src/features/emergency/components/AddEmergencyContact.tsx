import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native-paper';

import { MAX_CONTACTS } from '../../../services/contracts/account';
import { AppButton } from '../../../shared/components/AppButton';
import { ContactFormModal } from '../../account/components/ContactFormModal';
import { contactErrorKey } from '../../account/contactErrors';
import { useContactMutations } from '../../account/hooks/useContacts';

export function AddEmergencyContact({ count }: { count: number }) {
  const { t } = useTranslation('account');
  const { add } = useContactMutations();
  const [open, setOpen] = useState(false);
  const atLimit = count >= MAX_CONTACTS;
  const close = () => {
    setOpen(false);
    if (!add.isPending) add.reset();
  };

  return (
    <>
      <AppButton mode="contained" icon="plus" disabled={atLimit || add.isPending} onPress={() => { setOpen(true); }}>
        {t('contacts.add')}
      </AppButton>
      {atLimit ? <Text variant="bodyMedium">{t('contacts.limit', { max: MAX_CONTACTS })}</Text> : null}
      {open ? (
        <ContactFormModal visible saving={add.isPending} onClose={close}
          error={add.error ? t(contactErrorKey(add.error), { max: MAX_CONTACTS }) : undefined}
          onSave={(input) => { if (!add.isPending) add.mutate(input, { onSuccess: close }); }} />
      ) : null}
    </>
  );
}
