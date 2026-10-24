import type { EmergencyContact } from '../../../services/contracts';
import { useAuth } from '../../account/authContext';
import { useContacts } from '../../account/hooks/useContacts';

export type SosContacts =
  | { state: 'loading' | 'error' | 'loggedOut' | 'noContacts'; contacts: EmergencyContact[]; primary?: undefined }
  | { state: 'ready'; contacts: EmergencyContact[]; primary: EmergencyContact };

// What SOS can do right now. It never guesses: without a signed-in user and at least one contact there is
// nobody to call, and the screens say so instead of dialling something else.
export function useSosContacts(): SosContacts {
  const { user, status } = useAuth();
  const query = useContacts();
  if (status === 'loading') return { state: 'loading', contacts: [] };
  if (!user) return { state: 'loggedOut', contacts: [] };
  if (query.isPending) return { state: 'loading', contacts: [] };
  if (query.isError) return { state: 'error', contacts: [] };
  const [primary] = query.data;
  return primary ? { state: 'ready', contacts: query.data, primary } : { state: 'noContacts', contacts: [] };
}
